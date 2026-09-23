const GUMROAD_VERIFY = "https://api.gumroad.com/v2/licenses/verify"
const PRODUCT_ID = "AkOGKEr0_Y0c3eZXKnTvDA=="

export type LicenseResult =
    | { status: "verified"; valid: boolean; expiresAt?: number; uses?: number }
    | { status: "unavailable" }

// Never turn provider errors into a negative purchase verdict. Cancellation alone does not
// end paid access; Gumroad's subscription_ended_at is the authoritative end timestamp.
export async function verifyLicense(proKey: string, incrementUses = false): Promise<LicenseResult> {
    try {
        const res = await fetch(GUMROAD_VERIFY, {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                product_id: PRODUCT_ID,
                license_key: proKey,
                increment_uses_count: String(incrementUses),
            }),
            signal: AbortSignal.timeout(5000),
        })
        if (!res.ok && res.status !== 404) return { status: "unavailable" }
        const data = (await res.json()) as {
            success?: boolean
            uses?: number
            purchase?: {
                refunded?: boolean
                disputed?: boolean
                dispute_won?: boolean
                subscription_ended_at?: string | null
            }
        } | null
        if (!data || typeof data.success !== "boolean") return { status: "unavailable" }
        if (!data.success) return { status: "verified", valid: false }
        if (!res.ok || !data.purchase) return { status: "unavailable" }
        const purchase = data.purchase
        const expiresAt = purchase.subscription_ended_at
            ? Date.parse(purchase.subscription_ended_at)
            : undefined
        if (expiresAt !== undefined && !Number.isFinite(expiresAt)) return { status: "unavailable" }
        return {
            status: "verified",
            valid:
                !purchase.refunded &&
                !(purchase.disputed && !purchase.dispute_won) &&
                (expiresAt === undefined || expiresAt > Date.now()),
            expiresAt,
            uses: data.uses,
        }
    } catch {
        return { status: "unavailable" }
    }
}

export function proJson(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
            "access-control-allow-origin": "*",
            "access-control-allow-headers": "content-type, authorization",
            "access-control-allow-methods": "POST, OPTIONS",
        },
    })
}

export async function handleLicenseVerify(req: Request, activate = false): Promise<Response> {
    const body = (await req.json().catch(() => null)) as { proKey?: unknown } | null
    const proKey = typeof body?.proKey === "string" ? body.proKey.trim() : ""
    if (!proKey || proKey.length > 256) return proJson({ error: "invalid license key" }, 400)
    const result = await verifyLicense(proKey, activate)
    if (result.status === "unavailable") return proJson({ error: "upstream unavailable" }, 503)
    return proJson({ valid: result.valid, full: activate && (result.uses ?? 0) > 8 })
}
