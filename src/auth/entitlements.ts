// UI cache only. Server features always evaluate their own entitlement.
export interface ProEntitlement {
    pro: boolean
    sources: ("gumroad" | "stripe")[]
    status: "verified" | "unavailable"
    validUntil: number
    refreshAfter: number
}
const CACHE_KEY = "account_pro_entitlement"

export function cachedEntitlement(accountId: string | null): ProEntitlement | null {
    if (!accountId) return null
    try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null")
        const value = cached?.entitlement
        if (
            cached?.accountId !== accountId ||
            !value ||
            typeof value.pro !== "boolean" ||
            !Array.isArray(value.sources) ||
            !value.sources.every(
                (source: unknown) => source === "gumroad" || source === "stripe",
            ) ||
            !Number.isFinite(value.validUntil) ||
            !Number.isFinite(value.refreshAfter) ||
            !["verified", "unavailable"].includes(value.status)
        )
            return null
        return value
    } catch {
        return null
    }
}

export function saveEntitlement(accountId: string, entitlement: ProEntitlement): void {
    if (entitlement.status === "unavailable") return // preserve the previous bounded UI cache
    localStorage.setItem(CACHE_KEY, JSON.stringify({ accountId, entitlement }))
    localStorage.setItem("pro", String(entitlement.pro && entitlement.validUntil > Date.now()))
    localStorage.setItem("last_checked_pro", String(Date.now()))
}

export function clearAccountEntitlement(accountId: string | null): void {
    const cached = cachedEntitlement(accountId)
    if (cached) {
        // Signing out must remove Stripe-only access, but keep a usable legacy key.
        const legacy =
            !!localStorage.getItem("pro_key") &&
            cached.sources.includes("gumroad") &&
            Math.min(cached.validUntil, cached.refreshAfter) > Date.now()
        localStorage.setItem("pro", String(legacy))
    }
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem("last_checked_pro")
}
