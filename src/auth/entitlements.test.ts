import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    cachedEntitlement,
    clearAccountEntitlement,
    saveEntitlement,
    type ProEntitlement,
} from "./entitlements"

const values = new Map<string, string>()
vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
})
const membership = (sources: ProEntitlement["sources"] = ["stripe"]): ProEntitlement => ({
    pro: true,
    sources,
    status: "verified",
    validUntil: Date.now() + 86400000,
    refreshAfter: Date.now() + 86400000,
})
beforeEach(() => values.clear())

describe("account entitlement UI cache", () => {
    it("supports membership without a license key and isolates accounts", () => {
        saveEntitlement("a", membership())
        expect(localStorage.getItem("pro")).toBe("true")
        expect(cachedEntitlement("a")?.sources).toEqual(["stripe"])
        expect(cachedEntitlement("b")).toBeNull()
        expect(cachedEntitlement(null)).toBeNull()
    })
    it("removes Stripe-only access on sign-out even if an invalid legacy key exists", () => {
        localStorage.setItem("pro_key", "invalid")
        saveEntitlement("a", membership())
        clearAccountEntitlement("a")
        expect(localStorage.getItem("pro")).toBe("false")
        expect(cachedEntitlement("a")).toBeNull()
        expect(localStorage.getItem("pro_key")).toBe("invalid")
    })
    it("preserves a verified legacy purchase on sign-out", () => {
        localStorage.setItem("pro_key", "legacy")
        saveEntitlement("a", membership(["gumroad", "stripe"]))
        clearAccountEntitlement("a")
        expect(localStorage.getItem("pro")).toBe("true")
    })
    it("does not overwrite bounded cached access during upstream outages", () => {
        const valid = membership()
        saveEntitlement("a", valid)
        saveEntitlement("a", {
            ...valid,
            pro: false,
            sources: [],
            status: "unavailable",
            validUntil: 0,
        })
        expect(cachedEntitlement("a")).toEqual(valid)
        saveEntitlement("a", { ...valid, pro: false, sources: [], validUntil: 0 })
        expect(localStorage.getItem("pro")).toBe("false")
    })
    it("does not keep expired legacy grants on sign-out", () => {
        localStorage.setItem("pro_key", "legacy")
        saveEntitlement("a", { ...membership(["gumroad"]), validUntil: 1 })
        clearAccountEntitlement("a")
        expect(localStorage.getItem("pro")).toBe("false")
    })
    it("ignores corrupted cached status", () => {
        localStorage.setItem("account_pro_entitlement", "not-json")
        expect(cachedEntitlement("a")).toBeNull()
        localStorage.setItem(
            "account_pro_entitlement",
            JSON.stringify({ accountId: "a", entitlement: {} }),
        )
        expect(cachedEntitlement("a")).toBeNull()
    })
})
