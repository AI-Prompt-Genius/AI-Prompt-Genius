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
import {
    applyPulledFolders,
    clearFolderSyncState,
    getFoldersPush,
    type FolderStatePayload,
} from "./folderSync"

// Cloudflare sync client (Feature 2). Pushes only the changed/new/deleted records the app already
// tracks (changedPrompts / newPrompts / deletedPrompts), pulls rows changed since our last-seen
// rev. Authenticated with WorkOS AuthKit access tokens (see src/auth/authkit.ts) — signing in is
// optional; with no session every function here is a no-op and the app stays fully local.

const WORKER_URL = "https://aipromptgenius-sync.aipromptgenius.workers.dev"

const REV_KEY = "cf_sync_rev"
const LAST_SYNCED_KEY = "cf_last_synced"
const SYNC_PROTOCOL_KEY = "cf_sync_protocol"
const CURRENT_SYNC_PROTOCOL = 2
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
let syncInFlight: Promise<boolean> | null = null

export function isCloudSynced(): boolean {
    return isSignedIn()
}

export async function cloudSignOut(): Promise<void> {
    await signOut()
    localStorage.removeItem(REV_KEY)
    localStorage.removeItem(LAST_SYNCED_KEY)
    localStorage.removeItem(SYNC_PROTOCOL_KEY)
    localStorage.removeItem(SYNCED_IDS_KEY)
    localStorage.removeItem(SORTINDEX_BOOTSTRAP_KEY)
    localStorage.removeItem("cf_settings_synced")
    localStorage.removeItem("cf_settings_updated_at")
    localStorage.removeItem("cf_pro_key_synced")
    clearFolderSyncState()
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
async function performCloudSync(): Promise<boolean> {
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
        // The v2 Worker forces a full snapshot while upgrading this account. Keep sending the real
        // cursor during negotiation so a temporarily older Worker can still serve cheap deltas.
        const hasCurrentProtocol =
            localStorage.getItem(SYNC_PROTOCOL_KEY) === String(CURRENT_SYNC_PROTOCOL)
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

        const foldersAtRequest = [...store.folders]
        // Before v2 is confirmed, expose a dirty snapshot only through the legacy fallback. The
        // server accepts it during the one-way upgrade and rejects every legacy snapshot after it.
        const dirtyFolderState = getFoldersPush(foldersAtRequest, sinceRev)
        const folderState = hasCurrentProtocol ? dirtyFolderState : undefined
        const settings = getSettingsPush()
        const proKeyAtRequest = localStorage.getItem("pro_key")
        const proKey = getProKeyPush()
        const payload = {
            protocolVersion: CURRENT_SYNC_PROTOCOL,
            sinceRev,
            prompts: toPush,
            deletedPromptIds: deletedIds,
            // Versioned singleton state is omitted when unchanged. The Worker can consequently
            // answer an idle request with one sync_state lookup and zero writes.
            folderState,
            // During a rolling deploy, the old Worker ignores protocolVersion/folderState. Give it
            // the dirty snapshot in its legacy field; v2 accepts this only for the atomic upgrade.
            folders: hasCurrentProtocol ? undefined : dirtyFolderState?.names,
            settings,
            proKey,
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
            protocolVersion?: number
            rev: number
            prompts: ServerPromptRow[]
            folders: string[]
            folderState?: FolderStatePayload
            settings?: SettingsPayload
            proKey?: string | null
        }

        // Merge server rows into the local library with last-writer-wins (see merge.ts) so a
        // stale cloud tombstone can't delete a newer local prompt and a stale cloud row can't
        // clobber a newer local edit — the "sign in and lose my prompts" failure mode.
        // Re-read local prompts after the request so an edit made while it was in flight is not
        // overwritten by the pre-request snapshot. LWW keeps the newer local version pending.
        const currentPrompts: LegacyPrompt[] = normalizeAndSort(getObject("prompts", []))
        const pendingDeletedIds = new Set<string>(getObject("deletedPrompts", []))
        const merged = mergePulledPrompts(currentPrompts, data.prompts).filter(
            prompt => !pendingDeletedIds.has(prompt.id),
        )
        // During a staged rollout an older Worker returns only a folder delta array. Preserve its
        // union semantics until folderState is available; the new Worker always returns the full,
        // versioned authoritative list, including deletions.
        const currentFolders = usePromptStore.getState().folders
        const foldersChangedDuringRequest =
            currentFolders.length !== foldersAtRequest.length ||
            currentFolders.some((name, index) => name !== foldersAtRequest[index])
        const authoritativeFolders = data.folderState
            ? applyPulledFolders(data.folderState)
            : applyPulledFolders({
                  names: Array.from(new Set([...store.folders, ...(data.folders ?? [])])),
                  updatedAt: Math.max(Date.now(), (dirtyFolderState?.updatedAt ?? 0) + 1),
              })
        const upgradeFallbackRejected =
            !hasCurrentProtocol &&
            !!dirtyFolderState &&
            !!data.folderState &&
            (data.folderState.names.length !== foldersAtRequest.length ||
                data.folderState.names.some((name, index) => name !== foldersAtRequest[index]))
        // A rejected upgrade fallback remains local and differs from the newly recorded server
        // baseline, so the next confirmed-v2 request retries it as a versioned folderState.
        const pulledFolders =
            foldersChangedDuringRequest || upgradeFallbackRejected
                ? undefined
                : authoritativeFolders

        // Persist merged state through the store (localStorage + IndexedDB + picker mirror),
        // then clear the delta bookkeeping the server has now absorbed.
        store.replacePrompts(merged)
        if (pulledFolders) store.replaceFolders(pulledFolders)

        // Apply the account's settings + Pro license alongside the prompt merge.
        applyPulledSettings(data.settings)
        // Do not let an in-flight response undo a license activation/removal made locally after
        // this request started. Its dirty baseline remains untouched and will push next time.
        if (localStorage.getItem("pro_key") === proKeyAtRequest) applyPulledProKey(data.proKey)
        const sentVersions = new Map(toPush.map(prompt => [prompt.id, prompt.lastChanged ?? 0]))
        const currentById = new Map(currentPrompts.map(prompt => [prompt.id, prompt]))
        const returnedIds = new Set(data.prompts.map(row => row.id))
        setObject(
            "changedPrompts",
            (getObject("changedPrompts", []) as string[]).filter(id => {
                if (!returnedIds.has(id) || !sentVersions.has(id)) return true
                return (currentById.get(id)?.lastChanged ?? 0) > (sentVersions.get(id) ?? 0)
            }),
        )
        setObject(
            "newPrompts",
            (getObject("newPrompts", []) as string[]).filter(
                id => !returnedIds.has(id) || !sentVersions.has(id),
            ),
        )
        const sentDeletedIds = new Set(deletedIds)
        setObject(
            "deletedPrompts",
            (getObject("deletedPrompts", []) as string[]).filter(id => !sentDeletedIds.has(id)),
        )
        // Only rows sent in this request or returned by the server are acknowledged. A prompt
        // created while the request was in flight must remain unsynced for the next request.
        const acknowledgedIds = new Set(syncedIds)
        for (const row of data.prompts) {
            if (row.deleted_at) acknowledgedIds.delete(row.id)
            else acknowledgedIds.add(row.id)
        }
        setObject(SYNCED_IDS_KEY, Array.from(acknowledgedIds))
        localStorage.setItem(REV_KEY, String(data.rev))
        if (data.protocolVersion === CURRENT_SYNC_PROTOCOL) {
            localStorage.setItem(SYNC_PROTOCOL_KEY, String(CURRENT_SYNC_PROTOCOL))
        }
        localStorage.setItem(LAST_SYNCED_KEY, String(Date.now()))
        localStorage.setItem(SORTINDEX_BOOTSTRAP_KEY, "1")
        return true
    } catch (err) {
        console.error("Cloud sync failed", err)
        return false
    }
}

export function cloudSyncNow(): Promise<boolean> {
    if (syncInFlight) return syncInFlight
    syncInFlight = performCloudSync().finally(() => {
        syncInFlight = null
    })
    return syncInFlight
}

/** Background sync on app load — only when signed in and the last sync is stale. */
export function cloudSyncIfDue(): void {
    if (!isCloudSynced()) return
    const last = Number(localStorage.getItem(LAST_SYNCED_KEY) ?? 0)
    if (Date.now() - last > SYNC_INTERVAL_MS) {
        cloudSyncNow()
    }
}
