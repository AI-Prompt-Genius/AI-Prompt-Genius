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
    /** Mass-delete: clears prompts/folders + records tombstones for cloud sync. */
    clearAll: () => void
    /** Re-read from localStorage after an external write (cloud resync, cross-tab change). */
    reloadFromLegacy: () => void
}

export const usePromptStore = create<PromptStore>(set => ({
    prompts: getObject("prompts", []),
    folders: getObject("folders", []),

    replacePrompts: prompts => {
        writePromptsEverywhere(prompts)
        set({ prompts: [...prompts] })
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
        const prompts: LegacyPrompt[] = getObject("prompts", [])
        const folders: string[] = getObject("folders", [])
        sendMessageToParent({ message: "sync_prompts", data: prompts })
        set({ prompts, folders })
    },
}))

// Seed the picker mirror once on load (getObject reads are now pure — they no longer post).
sendMessageToParent({ message: "sync_prompts", data: usePromptStore.getState().prompts })
