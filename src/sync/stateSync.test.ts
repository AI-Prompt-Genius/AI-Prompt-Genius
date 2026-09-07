import { beforeEach, describe, expect, it, vi } from "vitest"
import { applyPulledFolders, getFoldersPush } from "./folderSync"
import { getProKeyPush, getSettingsPush } from "./settingsSync"

class MemoryStorage implements Storage {
    private values = new Map<string, string>()

    get length(): number {
        return this.values.size
    }

    clear(): void {
        this.values.clear()
    }

    getItem(key: string): string | null {
        return this.values.get(key) ?? null
    }

    key(index: number): string | null {
        return Array.from(this.values.keys())[index] ?? null
    }

    removeItem(key: string): void {
        this.values.delete(key)
    }

    setItem(key: string, value: string): void {
        this.values.set(key, String(value))
    }
}

vi.stubGlobal("localStorage", new MemoryStorage())

beforeEach(() => localStorage.clear())

describe("singleton sync dirty tracking", () => {
    it("omits settings after the server acknowledges the same snapshot", () => {
        localStorage.setItem("lng", "en")
        const first = getSettingsPush()
        expect(first?.data).toEqual({ lng: "en" })

        localStorage.setItem("cf_settings_synced", JSON.stringify(first?.data))
        expect(getSettingsPush()).toBeUndefined()

        localStorage.setItem("lng", "fr")
        expect(getSettingsPush()?.data).toEqual({ lng: "fr" })
    })

    it("distinguishes an unchanged Pro key from an explicit removal", () => {
        expect(getProKeyPush()).toBeUndefined()

        localStorage.setItem("pro_key", "license")
        expect(getProKeyPush()).toBe("license")

        localStorage.setItem("cf_pro_key_synced", JSON.stringify("license"))
        expect(getProKeyPush()).toBeUndefined()

        localStorage.removeItem("pro_key")
        expect(getProKeyPush()).toBeNull()
    })

    it("recovers from a corrupted Pro sync baseline", () => {
        localStorage.setItem("pro_key", "license")
        localStorage.setItem("cf_pro_key_synced", "not-json")
        expect(getProKeyPush()).toBe("license")

        localStorage.removeItem("pro_key")
        localStorage.setItem("cf_pro_key_synced", "still-not-json")
        expect(getProKeyPush()).toBeUndefined()
    })

    it("omits unchanged folders and applies an authoritative empty list", () => {
        expect(getFoldersPush([], 0)).toBeUndefined()

        const first = getFoldersPush(["Work"], 0)
        expect(first?.names).toEqual(["Work"])

        expect(applyPulledFolders(first)).toEqual(["Work"])
        expect(getFoldersPush(["Work"], 1)).toBeUndefined()
        expect(applyPulledFolders({ names: [], updatedAt: first!.updatedAt + 1 })).toEqual([])
    })
})
