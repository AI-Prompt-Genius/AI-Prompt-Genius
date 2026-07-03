import { db } from "./db"
import { getCurrentTimestamp, getObject, uuid } from "../components/js/utils"
import type { LegacyPrompt } from "../types"

const MIGRATION_FLAG = "migratedToIDB_v1"

// One-time seed of IndexedDB from the legacy localStorage blob. localStorage remains the
// canonical store through Phase B (cloudSyncing / export / the hotkey mirror still read it);
// IndexedDB is dual-written on every change so it can become canonical when Phase E removes
// the Google-Sheets sync path. The legacy blob is left untouched as a rollback safety net.
export async function migrateLegacyToIDB(): Promise<void> {
    if (localStorage.getItem(MIGRATION_FLAG) === "true") return

    try {
        const prompts: LegacyPrompt[] = getObject("prompts", [])
        const folders: string[] = getObject("folders", [])

        // Backfill bookkeeping fields that older records may be missing.
        const normalized: LegacyPrompt[] = prompts.map(p => ({
            ...p,
            id: p.id ?? uuid(),
            tags: Array.isArray(p.tags) ? p.tags : [],
            lastChanged: p.lastChanged ?? getCurrentTimestamp(),
        }))

        await db.transaction("rw", db.prompts, db.folders, async () => {
            await db.prompts.clear()
            await db.prompts.bulkPut(normalized)
            await db.folders.clear()
            await db.folders.bulkPut(folders.map((name, i) => ({ name, sortIndex: i })))
        })

        localStorage.setItem(MIGRATION_FLAG, "true")
    } catch (err) {
        console.error("IndexedDB migration failed; staying on localStorage", err)
    }
}
