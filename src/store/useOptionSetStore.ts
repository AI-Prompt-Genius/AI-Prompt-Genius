import { create } from "zustand"
import type { OptionSet } from "../types"
import { db } from "../data/db"
import { getCurrentTimestamp, getObject, setObject, uuid } from "../components/js/utils"

// Global, reusable dropdown option-sets for typed variables. A `{{tone::list@tones}}` token
// resolves its options from the set named "tones" here. Mirrors usePromptStore: localStorage is
// the canonical store (read on init), with a best-effort IndexedDB dual-write.
//
// NOTE: not yet wired into the Cloudflare sync worker — option-sets persist per-device. Cross-
// device sync is a follow-up (needs a matching table + /sync endpoint change on the worker).

const LS_KEY = "optionSets"

function writeEverywhere(sets: OptionSet[]): void {
    setObject(LS_KEY, sets)
    db.transaction("rw", db.optionSets, async () => {
        await db.optionSets.clear()
        await db.optionSets.bulkPut(sets)
    }).catch(err => console.error("Dexie optionSets write failed", err))
}

interface OptionSetStore {
    optionSets: OptionSet[]
    /** Create a set (or update the existing one with the same name). Returns its id. */
    upsertByName: (name: string, options: string[]) => string
    /** Rename/replace a set by id. */
    updateSet: (id: string, name: string, options: string[]) => void
    /** Remove a set by id. */
    removeSet: (id: string) => void
}

export const useOptionSetStore = create<OptionSetStore>((set, get) => ({
    optionSets: getObject(LS_KEY, []),

    upsertByName: (name, options) => {
        name = name.trim()
        const sets = [...get().optionSets]
        const existing = sets.find(s => s.name.toLowerCase() === name.toLowerCase())
        const now = getCurrentTimestamp()
        if (existing) {
            existing.name = name
            existing.options = options
            existing.updatedAt = now
            writeEverywhere(sets)
            set({ optionSets: sets })
            return existing.id
        }
        const created: OptionSet = {
            id: uuid(),
            name,
            options,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        }
        const next = [...sets, created]
        writeEverywhere(next)
        set({ optionSets: next })
        return created.id
    },

    updateSet: (id, name, options) => {
        const next = get().optionSets.map(s =>
            s.id === id
                ? { ...s, name: name.trim(), options, updatedAt: getCurrentTimestamp() }
                : s,
        )
        writeEverywhere(next)
        set({ optionSets: next })
    },

    removeSet: id => {
        const next = get().optionSets.filter(s => s.id !== id)
        writeEverywhere(next)
        set({ optionSets: next })
    },
}))

/** Look up a set's options by name (case-insensitive). Returns [] when not found. */
export function optionsForSet(sets: OptionSet[], name: string): string[] {
    const match = sets.find(s => s.name.toLowerCase() === name.trim().toLowerCase())
    return match ? match.options : []
}
