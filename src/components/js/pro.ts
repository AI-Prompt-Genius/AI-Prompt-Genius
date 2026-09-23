import { useSyncExternalStore } from "react"
import { sendMessageToParent } from "./utils"
import { getAccessToken, isSignedIn, userId, WORKER_URL } from "../../auth/customAuth"
import { cachedEntitlement, saveEntitlement, type ProEntitlement } from "../../auth/entitlements"

export function getProStatus(): boolean {
    const cached = cachedEntitlement(isSignedIn() ? userId() : null)
    if (cached) return cached.pro && Math.min(cached.validUntil, cached.refreshAfter) > Date.now()
    return localStorage.getItem("pro") === "true"
}

export function mirrorProToExtension() {
    const cached = cachedEntitlement(isSignedIn() ? userId() : null)
    sendMessageToParent({
        message: "pro_status",
        pro: getProStatus(),
        proKey: localStorage.getItem("pro_key") ?? null,
        proExpiresAt: cached?.pro ? Math.min(cached.validUntil, cached.refreshAfter) : 0,
    })
    window.dispatchEvent(new Event("pro-changed"))
}

export function applyAccountEntitlement(accountId: string, entitlement: ProEntitlement): void {
    if (!isSignedIn() || userId() !== accountId) return
    saveEntitlement(accountId, entitlement)
    mirrorProToExtension()
}

export function proRefreshDue(): boolean {
    const cached = cachedEntitlement(isSignedIn() ? userId() : null)
    const last = Number(localStorage.getItem("last_checked_pro") ?? 0)
    const now = Date.now()
    return (
        now - last > 24 * 60 * 60 * 1000 ||
        (!!cached && now >= cached.refreshAfter && now - last > 5 * 60 * 1000)
    )
}

let refreshing: Promise<boolean> | null = null
export function updateProStatus(): Promise<boolean> {
    if (refreshing) return refreshing
    refreshing = refreshProStatus().finally(() => {
        refreshing = null
    })
    return refreshing
}

async function refreshProStatus(): Promise<boolean> {
    const accountId = isSignedIn() ? userId() : null
    const key = localStorage.getItem("pro_key")
    // Back off on failures instead of retrying on every render. Sync also supplies fresh status.
    localStorage.setItem("last_checked_pro", String(Date.now()))
    try {
        if (accountId) {
            let token = await getAccessToken()
            if (!token) return getProStatus()
            const request = () =>
                fetch(`${WORKER_URL}/entitlements`, {
                    method: "POST",
                    headers: { authorization: `Bearer ${token}` },
                })
            let res = await request()
            if (res.status === 401) {
                token = await getAccessToken(true)
                if (!token) return getProStatus()
                res = await request()
            }
            if (res.ok && localStorage.getItem("pro_key") === key) {
                applyAccountEntitlement(accountId, (await res.json()) as ProEntitlement)
            }
        } else if (key) {
            const res = await fetch(`${WORKER_URL}/license/verify`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ proKey: key }),
            })
            if (res.ok && !isSignedIn() && localStorage.getItem("pro_key") === key) {
                const data = (await res.json()) as { valid: boolean }
                if (typeof data.valid === "boolean") localStorage.setItem("pro", String(data.valid))
            }
        } else if (!isSignedIn()) {
            localStorage.setItem("pro", "false")
        }
    } catch {
        // A provider/network outage is not a license revocation. Keep the key for retry.
    }
    mirrorProToExtension()
    return getProStatus()
}

export async function activateLicense(licenseKey: string): Promise<boolean | "full"> {
    const key = licenseKey.trim()
    if (!key) return false
    const accountId = userId()
    try {
        const res = await fetch(`${WORKER_URL}/license/activate`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ proKey: key }),
        })
        if (!res.ok || userId() !== accountId) return false
        const data = (await res.json()) as { valid: boolean; full: boolean }
        if (data.full) return "full"
        if (!data.valid) return false
        localStorage.setItem("pro_key", key)
        localStorage.setItem("pro", "true")
        localStorage.setItem("last_checked_pro", String(Date.now()))
        if (isSignedIn()) {
            // Sync links the legacy key to the account and returns the verified entitlement.
            const { cloudSyncNow } = await import("../../sync/syncClient")
            await cloudSyncNow()
            // An already-running sync may have captured the previous key.
            if (localStorage.getItem("cf_pro_key_synced") !== JSON.stringify(key))
                await cloudSyncNow()
        }
        mirrorProToExtension()
        return true
    } catch {
        return false
    }
}

function subscribePro(onChange: () => void): () => void {
    let timer: ReturnType<typeof setTimeout> | undefined
    const update = () => {
        clearTimeout(timer)
        const cached = cachedEntitlement(isSignedIn() ? userId() : null)
        const expiresAt = cached ? Math.min(cached.validUntil, cached.refreshAfter) : 0
        if (expiresAt > Date.now())
            timer = setTimeout(update, Math.min(expiresAt - Date.now() + 1, 86400000))
        onChange()
    }
    window.addEventListener("pro-changed", update)
    window.addEventListener("storage", update)
    update()
    return () => {
        clearTimeout(timer)
        window.removeEventListener("pro-changed", update)
        window.removeEventListener("storage", update)
    }
}

export function useProStatus(): boolean {
    return useSyncExternalStore(subscribePro, getProStatus)
}
