import { readFileSync } from "node:fs"
import { createContext, runInContext } from "node:vm"
import { describe, expect, it, vi } from "vitest"

const script = readFileSync(new URL("../../plugin/background.js", import.meta.url), "utf8")
function background(initial: Record<string, unknown>) {
    const storage = { ...initial }
    const event = { addListener: vi.fn() }
    const fetch = vi.fn(async () => ({ ok: true, json: async () => ({ valid: true }) }))
    const context = createContext({
        fetch,
        chrome: {
            storage: {
                local: {
                    get: async (defaults: Record<string, unknown>) => ({ ...defaults, ...storage }),
                    set: async (patch: Record<string, unknown>) => {
                        Object.assign(storage, patch)
                    },
                },
                onChanged: event,
            },
            alarms: { create: vi.fn(), onAlarm: event },
            runtime: { onStartup: event, onInstalled: event },
            commands: { onCommand: event },
        },
    })
    runInContext(script, context)
    return { fetch, storage, isPro: () => runInContext("isPro()", context) as Promise<boolean> }
}

describe("extension Pro mirror", () => {
    it("uses unexpired account access without checking a legacy key", async () => {
        const app = background({ pro: true, proExpiresAt: Date.now() + 60000, proKey: "old-key" })
        expect(await app.isPro()).toBe(true)
        expect(app.fetch).not.toHaveBeenCalled()
    })
    it("expires membership without a license key", async () => {
        const app = background({ pro: true, proExpiresAt: 1 })
        expect(await app.isPro()).toBe(false)
        expect(app.fetch).not.toHaveBeenCalled()
    })
    it("falls back to legacy verification after membership expiry and caches it", async () => {
        const app = background({ pro: true, proExpiresAt: 1, proKey: "legacy" })
        expect(await app.isPro()).toBe(true)
        expect(await app.isPro()).toBe(true)
        expect(app.fetch).toHaveBeenCalledTimes(1)
        expect(app.storage.proExpiresAt).toBe(0)
    })
    it("does not let a late invalid-key reply erase freshly mirrored membership", async () => {
        const app = background({ pro: false, proKey: "legacy", proCheckedAt: 1 })
        app.fetch.mockImplementationOnce(async () => {
            Object.assign(app.storage, { pro: true, proExpiresAt: Date.now() + 60000 })
            return { ok: true, json: async () => ({ valid: false }) }
        })
        expect(await app.isPro()).toBe(true)
        expect(app.storage.pro).toBe(true)
    })
})
