import type { LegacyPrompt } from "../types"

// Pure merge helpers for the Cloudflare sync client. Kept free of any localStorage / store /
// DOM imports so the last-writer-wins logic — the part that guards against data loss on sign-in
// — can be unit-tested in a plain node environment.

export interface ServerPromptRow {
    id: string
    title: string
    text: string
    description: string
    tags: string // semicolon-joined on the wire
    folder: string
    updated_at: number
    deleted_at: number | null
}

export function rowToPrompt(row: ServerPromptRow): LegacyPrompt {
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

/**
 * Last-writer-wins merge of pulled server rows into the local library.
 *
 * The server applies LWW on push; the client MUST do the same on pull, or a first sign-in
 * against a library that already holds old tombstones would silently drop live local prompts,
 * and a stale cloud row would clobber a newer local edit — the "sign in and lose my prompts"
 * failure mode. A server row only wins when its timestamp is at least as new as the local
 * copy's `lastChanged`; otherwise the local copy is kept untouched.
 */
export function mergePulledPrompts(
    localPrompts: LegacyPrompt[],
    serverRows: ServerPromptRow[],
): LegacyPrompt[] {
    const byId = new Map(localPrompts.map(p => [p.id, p]))
    for (const row of serverRows) {
        const local = byId.get(row.id)
        const localChanged = local?.lastChanged ?? 0
        if (row.deleted_at) {
            // Honor the delete only if it happened at/after our local copy's last change.
            if (!local || row.deleted_at >= localChanged) byId.delete(row.id)
        } else if (!local || (row.updated_at ?? 0) >= localChanged) {
            byId.set(row.id, rowToPrompt(row))
        }
    }
    return Array.from(byId.values())
}
