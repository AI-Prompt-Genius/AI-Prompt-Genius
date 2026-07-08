import Dexie, { type Table } from "dexie"
import type { LegacyPrompt, OptionSet } from "../types"

// Folders are still stored by their (unique) name in Phase B. Folder identity / nesting
// (parentId, rename) lands in Phase D; keeping the string-name shape here avoids rippling
// folderId through export / the hotkey mirror before those consumers move.
export interface FolderRecord {
    name: string
    sortIndex: number
}

class PromptGeniusDB extends Dexie {
    prompts!: Table<LegacyPrompt, string>
    folders!: Table<FolderRecord, string>
    // Reusable dropdown option-sets for typed variables ({{n::list@setName}}).
    optionSets!: Table<OptionSet, string>

    constructor() {
        super("AIPromptGenius")
        this.version(1).stores({
            // indexed on folder + lastChanged so Phase C/D can query by folder without a full scan
            prompts: "id, folder, lastChanged",
            folders: "name, sortIndex",
        })
        this.version(2).stores({
            optionSets: "id, name",
        })
    }
}

export const db = new PromptGeniusDB()
