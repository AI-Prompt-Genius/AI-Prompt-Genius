import type { LegacyPrompt } from "../types"
import { getObject, setObject } from "../components/js/utils"
import { usePromptStore } from "../store/usePromptStore"
import { getAccessToken, isSignedIn, signOut } from "../auth/customAuth"

// Cloudflare sync client (Feature 2). Pushes only the changed/new/deleted records the app already
// tracks (changedPrompts / newPrompts / deletedPrompts), pulls rows changed since our last-seen
// rev. Authenticated with WorkOS AuthKit access tokens (see src/auth/authkit.ts) — signing in is
// optional; with no session every function here is a no-op and the app stays fully local.

const WORKER_URL = "https://aipromptgenius-sync.aipromptgenius.workers.dev"

const REV_KEY = "cf_sync_rev"
const LAST_SYNCED_KEY = "cf_last_synced"
const SYNC_INTERVAL_MS = 5 * 60 * 1000

interface ServerPromptRow {
    id: string
    title: string
    text: string
    description: string
    tags: string // semicolon-joined on the wire
    folder: string
    updated_at: number
    deleted_at: number | null
}

export function isCloudSynced(): boolean {
    return isSignedIn()
}

export async function cloudSignOut(): Promise<void> {
    await signOut()
    localStorage.removeItem(REV_KEY)
    localStorage.removeItem(LAST_SYNCED_KEY)
    localStorage.setItem("syncPreference", "local")
}

function rowToPrompt(row: ServerPromptRow): LegacyPrompt {
    return {
        id: row.id,
        title: row.title ?? "",
        text: row.text ?? "",
        description: row.description ?? "",
        tags: row.tags ? row.tags.split(";").filter(t => t !== "") : [],
        folder: row.folder ?? "",
        lastChanged: row.updated_at,
    }
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
            folders: store.folders,
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

        // Merge server rows into the local library (tombstones delete, others upsert).
        const byId = new Map(localPrompts.map(p => [p.id, p]))
        for (const row of data.prompts) {
            if (row.deleted_at) byId.delete(row.id)
            else byId.set(row.id, rowToPrompt(row))
        }
        const merged = Array.from(byId.values())
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
