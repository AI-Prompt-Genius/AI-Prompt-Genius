import { create } from "zustand"
import type { LegacyPrompt } from "../types"
import { db } from "../data/db"
import {
    getCurrentTimestamp,
    getObject,
    sendMessageToParent,
    setObject,
} from "../components/js/utils"

// Single in-memory source of truth for prompts + folders. Replaces the App-level
// `useLocalStorage("prompts")` + shadow `filteredPrompts` state that drifted and forced the
// double-`setState` hack. Mutations still flow through the tested legacy utils (which own the
// newPrompts/changedPrompts/deletedPrompts bookkeeping that syncClient consumes); this store
// just persists the resulting array immutably and keeps IndexedDB + the hotkey mirror in sync.

// Ensure every prompt carries a numeric `sortIndex` (backfilling legacy records from their current
// array order) and return the list sorted ascending by it. Keeping the store array in sortIndex
// order means the existing array-order rendering stays correct without any per-view sorting. Sorting
// is stable (array index breaks ties) so records with equal indices keep their relative order.
export function normalizeAndSort(prompts: LegacyPrompt[]): LegacyPrompt[] {
    const withIdx = prompts.map((p, i) =>
        typeof p.sortIndex === "number" ? p : { ...p, sortIndex: i },
    )
    return withIdx
        .map((p, i) => ({ p, i }))
        .sort((a, b) => (a.p.sortIndex as number) - (b.p.sortIndex as number) || a.i - b.i)
        .map(x => x.p)
}

function writePromptsEverywhere(prompts: LegacyPrompt[]): void {
    setObject("prompts", prompts) // localStorage — canonical for export until Phase E
    sendMessageToParent({ message: "sync_prompts", data: prompts }) // Ctrl+Shift+P picker mirror
    // IndexedDB dual-write (best-effort; becomes canonical when Phase E drops localStorage)
    db.transaction("rw", db.prompts, async () => {
        await db.prompts.clear()
        await db.prompts.bulkPut(prompts)
    }).catch(err => console.error("Dexie prompts write failed", err))
}

function writeFoldersEverywhere(folders: string[]): void {
    setObject("folders", folders)
    db.transaction("rw", db.folders, async () => {
        await db.folders.clear()
        await db.folders.bulkPut(folders.map((name, i) => ({ name, sortIndex: i })))
    }).catch(err => console.error("Dexie folders write failed", err))
}

interface PromptStore {
    prompts: LegacyPrompt[]
    folders: string[]
    /** Replace the full prompt list (callers pass the array returned by the legacy utils). */
    replacePrompts: (prompts: LegacyPrompt[]) => void
    /** Replace the full folder list. */
    replaceFolders: (folders: string[]) => void
    /** Rename a folder and re-point every prompt that lived in it (Feature 1). */
    renameFolder: (oldName: string, newName: string) => void
    /**
     * Reorder the master list by moving `draggedId` next to `targetId` — immediately before it,
     * or after it when `placeAfter` is true (used to drop into the gap below a card).
     */
    reorderPrompts: (draggedId: string, targetId: string, placeAfter?: boolean) => void
    /** Mass-delete: clears prompts/folders + records tombstones for cloud sync. */
    clearAll: () => void
    /** Re-read from localStorage after an external write (cloud resync, cross-tab change). */
    reloadFromLegacy: () => void
}

export const usePromptStore = create<PromptStore>(set => ({
    prompts: normalizeAndSort(getObject("prompts", [])),
    folders: getObject("folders", []),

    replacePrompts: prompts => {
        // Sort by sortIndex on every write so the persisted array, the picker mirror, and the
        // rendered order all agree — this is what applies cross-device order pulled from the server.
        const sorted = normalizeAndSort(prompts)
        writePromptsEverywhere(sorted)
        set({ prompts: sorted })
    },

    replaceFolders: folders => {
        writeFoldersEverywhere(folders)
        set({ folders: [...folders] })
    },

    renameFolder: (oldName, newName) => {
        newName = newName.trim()
        if (!newName || oldName === newName) return

        // Fold into an existing folder of the same name if there is one (dedupe).
        const folders: string[] = getObject("folders", [])
        if (!folders.includes(oldName)) return
        const nextFolders = Array.from(new Set(folders.map(f => (f === oldName ? newName : f))))

        // Re-point every prompt in the old folder and flag it for cloud sync.
        const prompts: LegacyPrompt[] = getObject("prompts", [])
        const changed: string[] = getObject("changedPrompts", [])
        const nextPrompts = prompts.map(p => {
            if (p.folder !== oldName) return p
            changed.push(p.id)
            return { ...p, folder: newName, lastChanged: getCurrentTimestamp() }
        })
        setObject("changedPrompts", Array.from(new Set(changed)))

        writeFoldersEverywhere(nextFolders)
        writePromptsEverywhere(nextPrompts)
        set({ folders: [...nextFolders], prompts: [...nextPrompts] })
    },

    reorderPrompts: (draggedId, targetId, placeAfter = false) => {
        if (draggedId === targetId) return
        // Work from a normalized+sorted copy so every prompt has a numeric sortIndex to bisect.
        const prompts = normalizeAndSort(getObject("prompts", []))
        const dragged = prompts.find(p => p.id === draggedId)
        if (!dragged || !prompts.some(p => p.id === targetId)) return

        // Find the two prompts the dragged item will land between (ignoring itself), then give it
        // a fractional sortIndex at their midpoint. Only the dragged prompt's index changes, so a
        // reorder pushes exactly one row to the server instead of renumbering the whole library.
        const ordered = prompts.filter(p => p.id !== draggedId)
        const targetIdx = ordered.findIndex(p => p.id === targetId)
        const insertAt = placeAfter ? targetIdx + 1 : targetIdx
        const beforeIdx = ordered[insertAt - 1]?.sortIndex as number | undefined
        const afterIdx = ordered[insertAt]?.sortIndex as number | undefined

        let newIndex: number
        if (beforeIdx === undefined && afterIdx === undefined) newIndex = 0
        else if (beforeIdx === undefined) newIndex = (afterIdx as number) - 1
        else if (afterIdx === undefined) newIndex = beforeIdx + 1
        else newIndex = (beforeIdx + afterIdx) / 2
        if (newIndex === dragged.sortIndex) return // dropped back into its own slot — no-op

        // Bump lastChanged so last-writer-wins propagates the new order, and flag it for the push.
        const next = prompts.map(p =>
            p.id === draggedId
                ? { ...p, sortIndex: newIndex, lastChanged: getCurrentTimestamp() }
                : p,
        )
        const changed: string[] = getObject("changedPrompts", [])
        setObject("changedPrompts", Array.from(new Set([...changed, draggedId])))

        const sorted = normalizeAndSort(next)
        writePromptsEverywhere(sorted)
        set({ prompts: sorted })
    },

    clearAll: () => {
        const prompts: LegacyPrompt[] = getObject("prompts", [])
        setObject(
            "deletedPrompts",
            prompts.map(p => p.id),
        )
        setObject("newPrompts", [])
        setObject("changedPrompts", [])
        localStorage.removeItem("prompts")
        localStorage.removeItem("folders")
        sendMessageToParent({ message: "sync_prompts", data: [] })
        db.transaction("rw", db.prompts, db.folders, async () => {
            await db.prompts.clear()
            await db.folders.clear()
        }).catch(err => console.error("Dexie clear failed", err))
        set({ prompts: [], folders: [] })
    },

    reloadFromLegacy: () => {
        const prompts = normalizeAndSort(getObject("prompts", []))
        const folders: string[] = getObject("folders", [])
        sendMessageToParent({ message: "sync_prompts", data: prompts })
        set({ prompts, folders })
    },
}))

// Seed the picker mirror once on load (getObject reads are now pure — they no longer post).
sendMessageToParent({ message: "sync_prompts", data: usePromptStore.getState().prompts })
