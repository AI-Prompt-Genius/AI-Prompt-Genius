import type { LegacyPrompt } from "../types"
import { getObject, setObject } from "../components/js/utils"
import { usePromptStore } from "../store/usePromptStore"
import { getAccessToken, isSignedIn, signOut } from "../auth/customAuth"
import { mergePulledPrompts, type ServerPromptRow } from "./merge"

// Cloudflare sync client (Feature 2). Pushes only the changed/new/deleted records the app already
// tracks (changedPrompts / newPrompts / deletedPrompts), pulls rows changed since our last-seen
// rev. Authenticated with WorkOS AuthKit access tokens (see src/auth/authkit.ts) — signing in is
// optional; with no session every function here is a no-op and the app stays fully local.

const WORKER_URL = "https://aipromptgenius-sync.aipromptgenius.workers.dev"

const REV_KEY = "cf_sync_rev"
const LAST_SYNCED_KEY = "cf_last_synced"
const SYNC_INTERVAL_MS = 5 * 60 * 1000

export function isCloudSynced(): boolean {
    return isSignedIn()
}

export async function cloudSignOut(): Promise<void> {
    await signOut()
    localStorage.removeItem(REV_KEY)
    localStorage.removeItem(LAST_SYNCED_KEY)
    localStorage.setItem("syncPreference", "local")
}

async function postSync(token: string, payload: unknown): Promise<Response> {
    return fetch(`${WORKER_URL}/sync`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    })
}

/** Push local deltas, pull server changes since our last rev, merge into the store. */
export async function cloudSyncNow(): Promise<boolean> {
    let token = await getAccessToken()
    if (!token) return false

    try {
        const store = usePromptStore.getState()
        const localPrompts: LegacyPrompt[] = getObject("prompts", [])

        // The app already tracks exactly the deltas the endpoint wants.
        const changedIds = new Set<string>([
            ...getObject("changedPrompts", []),
            ...getObject("newPrompts", []),
        ])
        const deletedIds: string[] = Array.from(new Set(getObject("deletedPrompts", [])))
        const sinceRev = Number(localStorage.getItem(REV_KEY) ?? 0)

        // First sync after sign-in (rev 0): push the whole library so nothing is stranded local.
        const toPush =
            sinceRev === 0 ? localPrompts : localPrompts.filter(p => changedIds.has(p.id))

        const payload = {
            sinceRev,
            prompts: toPush,
            deletedPromptIds: deletedIds,
            // Folders use replace-set semantics server-side (it tombstones anything omitted).
            // On the first sync after sign-in an empty local folder list would therefore wipe
            // folders already in the cloud from another device — so don't assert our folder set
            // until we actually have one. (Subsequent syncs send it as-is so deletes propagate.)
            folders: sinceRev === 0 && store.folders.length === 0 ? undefined : store.folders,
        }
        let res = await postSync(token, payload)
        if (res.status === 401) {
            // Token may have just expired — force one refresh and retry before giving up.
            token = await getAccessToken(true)
            if (!token) return false
            res = await postSync(token, payload)
        }
        if (!res.ok) throw new Error(`sync failed: ${res.status}`)

        const data = (await res.json()) as {
            rev: number
            prompts: ServerPromptRow[]
            folders: string[]
        }

        // Merge server rows into the local library with last-writer-wins (see merge.ts) so a
        // stale cloud tombstone can't delete a newer local prompt and a stale cloud row can't
        // clobber a newer local edit — the "sign in and lose my prompts" failure mode.
        const merged = mergePulledPrompts(localPrompts, data.prompts)
        const mergedFolders = Array.from(new Set([...store.folders, ...data.folders]))

        // Persist merged state through the store (localStorage + IndexedDB + picker mirror),
        // then clear the delta bookkeeping the server has now absorbed.
        store.replacePrompts(merged)
        store.replaceFolders(mergedFolders)
        setObject("changedPrompts", [])
        setObject("newPrompts", [])
        setObject("deletedPrompts", [])
        localStorage.setItem(REV_KEY, String(data.rev))
        localStorage.setItem(LAST_SYNCED_KEY, String(Date.now()))
        return true
    } catch (err) {
        console.error("Cloud sync failed", err)
        return false
    }
}

/** Background sync on app load — only when signed in and the last sync is stale. */
export function cloudSyncIfDue(): void {
    if (!isCloudSynced()) return
    const last = Number(localStorage.getItem(LAST_SYNCED_KEY) ?? 0)
    if (Date.now() - last > SYNC_INTERVAL_MS) {
        cloudSyncNow()
    }
}
