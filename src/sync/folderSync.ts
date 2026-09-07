import { getObject, setObject } from "../components/js/utils"

export interface FolderStatePayload {
    names: string[]
    updatedAt: number
}

const FOLDERS_SYNCED_KEY = "cf_folders_synced"
const FOLDERS_TS_KEY = "cf_folders_updated_at"

function sameFolders(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((name, index) => name === b[index])
}

/** Return the full, versioned folder list only when it changed on this device. */
export function getFoldersPush(names: string[], sinceRev: number): FolderStatePayload | undefined {
    const baseline = getObject(FOLDERS_SYNCED_KEY, null) as string[] | null
    if (baseline && sameFolders(baseline, names)) return undefined

    // A fresh empty device should pull the account's folder list before asserting an empty list.
    if (baseline === null && sinceRev === 0 && names.length === 0) return undefined

    const previous = Number(localStorage.getItem(FOLDERS_TS_KEY) ?? 0)
    const updatedAt = Math.max(Date.now(), previous + 1)
    localStorage.setItem(FOLDERS_TS_KEY, String(updatedAt))
    return { names: [...names], updatedAt }
}

/** Record the server-authoritative folder state and return the list the store should persist. */
export function applyPulledFolders(pulled: FolderStatePayload | undefined): string[] | undefined {
    if (!pulled) return undefined
    const names = Array.from(new Set(pulled.names.filter(name => typeof name === "string")))
    setObject(FOLDERS_SYNCED_KEY, names)
    localStorage.setItem(FOLDERS_TS_KEY, String(pulled.updatedAt))
    return names
}

export function clearFolderSyncState(): void {
    localStorage.removeItem(FOLDERS_SYNCED_KEY)
    localStorage.removeItem(FOLDERS_TS_KEY)
}
