import type { LegacyPrompt } from "../types"
import { getObject, setObject } from "../components/js/utils"
import { usePromptStore, normalizeAndSort } from "../store/usePromptStore"
import { getAccessToken, isSignedIn, signOut } from "../auth/customAuth"
import { mergePulledPrompts, type ServerPromptRow } from "./merge"
import {
    getSettingsPush,
    getProKeyPush,
    applyPulledSettings,
    applyPulledProKey,
    type SettingsPayload,
} from "./settingsSync"

// Cloudflare sync client (Feature 2). Pushes only the changed/new/deleted records the app already
// tracks (changedPrompts / newPrompts / deletedPrompts), pulls rows changed since our last-seen
// rev. Authenticated with WorkOS AuthKit access tokens (see src/auth/authkit.ts) — signing in is
// optional; with no session every function here is a no-op and the app stays fully local.

const WORKER_URL = "https://aipromptgenius-sync.aipromptgenius.workers.dev"

const REV_KEY = "cf_sync_rev"
const LAST_SYNCED_KEY = "cf_last_synced"
// Ids of prompts the server has acknowledged (pushed by us or pulled from it). Any local prompt
// NOT in this set is pushed regardless of rev — this is what recovers prompts that were written
// straight to localStorage without delta bookkeeping (e.g. the old-extension TransferModal import),
// which would otherwise only ever upload during a rev-0 first sync.
const SYNCED_IDS_KEY = "cf_synced_ids"
// Set once we've pushed every local prompt's sortIndex to the server. Accounts that were already
// fully synced before manual ordering existed need one full push to seed sort_index server-side;
// after that reorders push single rows via the normal delta path.
const SORTINDEX_BOOTSTRAP_KEY = "cf_sortindex_pushed"
const SYNC_INTERVAL_MS = 5 * 60 * 1000

export function isCloudSynced(): boolean {
    return isSignedIn()
}

export async function cloudSignOut(): Promise<void> {
    await signOut()
    localStorage.removeItem(REV_KEY)
    localStorage.removeItem(LAST_SYNCED_KEY)
    localStorage.removeItem(SYNCED_IDS_KEY)
    localStorage.removeItem(SORTINDEX_BOOTSTRAP_KEY)
    localStorage.removeItem("cf_settings_synced")
    localStorage.removeItem("cf_settings_updated_at")
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
        // Normalize so every prompt carries a sortIndex before it goes up the wire (legacy records
        // written straight to localStorage may still lack one).
        const localPrompts: LegacyPrompt[] = normalizeAndSort(getObject("prompts", []))

        // The app already tracks exactly the deltas the endpoint wants.
        const changedIds = new Set<string>([
            ...getObject("changedPrompts", []),
            ...getObject("newPrompts", []),
        ])
        const deletedIds: string[] = Array.from(new Set(getObject("deletedPrompts", [])))
        const sinceRev = Number(localStorage.getItem(REV_KEY) ?? 0)

        // Push every prompt that is either explicitly changed OR not yet known to the server.
        // The latter clause is what recovers prompts written straight to localStorage without
        // bookkeeping (old-extension transfer import): they'd otherwise only ever upload during
        // the rev-0 first sync, and would be stranded forever if the rev had already advanced.
        const syncedIds = new Set<string>(getObject(SYNCED_IDS_KEY, []))
        // One-time full push seeds sort_index for accounts already fully synced before ordering
        // existed; those prompts are all in syncedIds and unchanged, so they'd never push otherwise.
        // Their lastChanged is left untouched, so this is LWW-safe (a newer row on another device
        // still wins). After it succeeds we flip the flag and go back to delta pushes.
        const needsSortIndexBootstrap = localStorage.getItem(SORTINDEX_BOOTSTRAP_KEY) !== "1"
        const toPush = needsSortIndexBootstrap
            ? localPrompts
            : localPrompts.filter(p => changedIds.has(p.id) || !syncedIds.has(p.id))

        const payload = {
            sinceRev,
            prompts: toPush,
            deletedPromptIds: deletedIds,
            // Folders use replace-set semantics server-side (it tombstones anything omitted).
            // On the first sync after sign-in an empty local folder list would therefore wipe
            // folders already in the cloud from another device — so don't assert our folder set
            // until we actually have one. (Subsequent syncs send it as-is so deletes propagate.)
            folders: sinceRev === 0 && store.folders.length === 0 ? undefined : store.folders,
            // Account settings blob (LWW) + Pro license key (sticky server-side). proKey is only
            // sent when this device actually has one, so it never wipes the account's license.
            settings: getSettingsPush(),
            proKey: getProKeyPush(),
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
            settings?: SettingsPayload
            proKey?: string | null
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

        // Apply the account's settings + Pro license alongside the prompt merge.
        applyPulledSettings(data.settings)
        applyPulledProKey(data.proKey)
        setObject("changedPrompts", [])
        setObject("newPrompts", [])
        setObject("deletedPrompts", [])
        // Everything in the merged library is now on the server (we pushed all unsynced local
        // prompts above, and the rest came from the server), so record it as the acknowledged set.
        setObject(
            SYNCED_IDS_KEY,
            merged.map(p => p.id),
        )
        localStorage.setItem(REV_KEY, String(data.rev))
        localStorage.setItem(LAST_SYNCED_KEY, String(Date.now()))
        localStorage.setItem(SORTINDEX_BOOTSTRAP_KEY, "1")
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
