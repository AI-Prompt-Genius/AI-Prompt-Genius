import Dexie, { type Table } from "dexie"
import type { LegacyPrompt } from "../types"

// Folders are still stored by their (unique) name in Phase B. Folder identity / nesting
// (parentId, rename) lands in Phase D; keeping the string-name shape here avoids rippling
// folderId through cloudSyncing / export / the hotkey mirror before those consumers move.
export interface FolderRecord {
    name: string
    sortIndex: number
}

class PromptGeniusDB extends Dexie {
    prompts!: Table<LegacyPrompt, string>
    folders!: Table<FolderRecord, string>

    constructor() {
        super("AIPromptGenius")
        this.version(1).stores({
            // indexed on folder + lastChanged so Phase C/D can query by folder without a full scan
            prompts: "id, folder, lastChanged",
            folders: "name, sortIndex",
        })
    }
}

export const db = new PromptGeniusDB()
