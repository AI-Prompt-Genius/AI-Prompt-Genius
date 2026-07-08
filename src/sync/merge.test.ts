import { describe, expect, it } from "vitest"
import { mergePulledPrompts, rowToPrompt, type ServerPromptRow } from "./merge"
import type { LegacyPrompt } from "../types"

const local = (id: string, lastChanged: number, over: Partial<LegacyPrompt> = {}): LegacyPrompt => ({
    id,
    title: `local-${id}`,
    text: "local text",
    description: "",
    tags: [],
    folder: "",
    lastChanged,
    ...over,
})

const row = (id: string, over: Partial<ServerPromptRow> = {}): ServerPromptRow => ({
    id,
    title: `server-${id}`,
    text: "server text",
    description: "",
    tags: "",
    folder: "",
    updated_at: 0,
    deleted_at: null,
    ...over,
})

describe("mergePulledPrompts — last-writer-wins, non-destructive", () => {
    it("keeps all local prompts when the cloud is empty (first sign-in, wiped DB)", () => {
        const locals = [local("a", 100), local("b", 200)]
        const merged = mergePulledPrompts(locals, [])
        expect(merged.map(p => p.id).sort()).toEqual(["a", "b"])
    })

    it("adds server prompts we don't have locally", () => {
        const merged = mergePulledPrompts([local("a", 100)], [row("b", { updated_at: 50 })])
        expect(merged.map(p => p.id).sort()).toEqual(["a", "b"])
        expect(merged.find(p => p.id === "b")?.title).toBe("server-b")
    })

    it("does NOT delete a local prompt that is newer than a cloud tombstone", () => {
        // The dangerous case: a stale delete arrives from the cloud but our copy is newer.
        const merged = mergePulledPrompts(
            [local("a", 500)],
            [row("a", { deleted_at: 200, updated_at: 100 })],
        )
        expect(merged.map(p => p.id)).toEqual(["a"])
        expect(merged[0].title).toBe("local-a") // untouched
    })

    it("DOES delete a local prompt when the cloud tombstone is newer (genuine remote delete)", () => {
        const merged = mergePulledPrompts(
            [local("a", 100)],
            [row("a", { deleted_at: 500, updated_at: 100 })],
        )
        expect(merged).toEqual([])
    })

    it("does NOT overwrite a newer local edit with a stale cloud row", () => {
        const merged = mergePulledPrompts(
            [local("a", 500, { title: "my newer edit" })],
            [row("a", { updated_at: 100 })],
        )
        expect(merged[0].title).toBe("my newer edit")
    })

    it("DOES apply a newer cloud edit over an older local copy", () => {
        const merged = mergePulledPrompts(
            [local("a", 100)],
            [row("a", { updated_at: 500, title: "newer from another device" })],
        )
        expect(merged[0].title).toBe("newer from another device")
    })

    it("applies an equal-timestamp cloud row (tie → server wins, matches server-side push LWW)", () => {
        const merged = mergePulledPrompts(
            [local("a", 300, { title: "local" })],
            [row("a", { updated_at: 300, title: "server" })],
        )
        expect(merged[0].title).toBe("server")
    })

    it("ignores a tombstone for an id we never had (no resurrection, no crash)", () => {
        const merged = mergePulledPrompts([local("a", 100)], [row("z", { deleted_at: 999 })])
        expect(merged.map(p => p.id)).toEqual(["a"])
    })
})

describe("sortIndex mapping — manual order sync", () => {
    it("maps the server's sort_index onto the prompt's sortIndex", () => {
        expect(rowToPrompt(row("a", { sort_index: 0.5 })).sortIndex).toBe(0.5)
    })

    it("defaults a missing sort_index to 0 (pre-migration rows)", () => {
        expect(rowToPrompt(row("a")).sortIndex).toBe(0)
    })

    it("a newer cloud row carries its reordered sortIndex over the local copy", () => {
        // Device B reordered 'a' (bumped updated_at). On pull, B's index must win, not our stale one.
        const merged = mergePulledPrompts(
            [local("a", 100, { sortIndex: 3 })],
            [row("a", { updated_at: 500, sort_index: 0.25 })],
        )
        expect(merged[0].sortIndex).toBe(0.25)
    })

    it("keeps the local sortIndex when the local copy is newer than the cloud row", () => {
        const merged = mergePulledPrompts(
            [local("a", 500, { sortIndex: 0.25 })],
            [row("a", { updated_at: 100, sort_index: 3 })],
        )
        expect(merged[0].sortIndex).toBe(0.25)
    })
})
