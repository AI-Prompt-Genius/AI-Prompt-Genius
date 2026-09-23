import { proJson, verifyLicense } from "./license"

const DAY = 24 * 60 * 60 * 1000
const RETRY_DELAY = 5 * 60 * 1000

export interface EntitlementState {
    pro_key: string | null
    gumroad_key_hash: string | null
    gumroad_valid_until: number
    gumroad_check_after: number
    gumroad_unavailable: number
    stripe_pro_until: number
    stripe_version: number
}

export interface ProEntitlement {
    pro: boolean
    sources: ("gumroad" | "stripe")[]
    status: "verified" | "unavailable"
    validUntil: number
    // UI refresh hint only. Protected server features must call resolveEntitlement themselves.
    refreshAfter: number
}

async function hashKey(key: string): Promise<string> {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key))
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("")
}

/** Uses an already-loaded account row. No query/write on the normal sync path. */
export async function resolveEntitlement(
    db: D1Database,
    userId: string,
    state: EntitlementState,
): Promise<ProEntitlement> {
    const now = Date.now()
    const key = state.pro_key?.trim() ?? ""
    const keyHash = key ? await hashKey(key) : null
    let validUntil = state.gumroad_key_hash === keyHash ? state.gumroad_valid_until : 0
    let checkAfter = state.gumroad_key_hash === keyHash ? state.gumroad_check_after : 0
    let unavailable = state.gumroad_key_hash === keyHash && !!state.gumroad_unavailable

    if (key && checkAfter <= now) {
        const verdict =
            key.length <= 256
                ? await verifyLicense(key)
                : ({ status: "verified", valid: false } as const)
        unavailable = verdict.status === "unavailable"
        if (verdict.status === "verified") {
            validUntil = verdict.valid ? Math.min(now + DAY, verdict.expiresAt ?? Infinity) : 0
        }
        checkAfter = now + (unavailable ? RETRY_DELAY : DAY)
        if (validUntil > now) checkAfter = Math.min(checkAfter, validUntil)
        // Compare-and-swap: a key replacement or another completed verification must not be
        // overwritten by this request's upstream result. Concurrent losers reread, not rewrite.
        const result = await db
            .prepare(
                `UPDATE sync_state SET
            gumroad_key_hash = ?2, gumroad_valid_until = ?3,
            gumroad_check_after = ?4, gumroad_unavailable = ?5
            WHERE user_id = ?1 AND pro_key IS ?6
              AND gumroad_check_after = ?7 AND gumroad_key_hash IS ?8`,
            )
            .bind(
                userId,
                keyHash,
                validUntil,
                checkAfter,
                Number(unavailable),
                state.pro_key,
                state.gumroad_check_after,
                state.gumroad_key_hash,
            )
            .run()
        if (result.meta.changes === 0) {
            const latest = await db
                .prepare("SELECT * FROM sync_state WHERE user_id = ?")
                .bind(userId)
                .first<EntitlementState>()
            // Do not restart upstream I/O during a race. Fail closed until the next request.
            if (!latest)
                return {
                    pro: false,
                    sources: [],
                    status: "unavailable",
                    validUntil: 0,
                    refreshAfter: now + RETRY_DELAY,
                }
            const latestHash = latest.pro_key?.trim() ? await hashKey(latest.pro_key.trim()) : null
            return summarize(latest, latestHash, now)
        }
    }
    return summarize(
        {
            ...state,
            gumroad_key_hash: keyHash,
            gumroad_valid_until: validUntil,
            gumroad_check_after: checkAfter,
            gumroad_unavailable: Number(unavailable),
        },
        keyHash,
        now,
    )
}

function summarize(state: EntitlementState, keyHash: string | null, now: number): ProEntitlement {
    const matchingKey = !!keyHash && keyHash === state.gumroad_key_hash
    const gumroad = matchingKey && state.gumroad_valid_until > now
    const stripe = state.stripe_pro_until > now
    const unknown =
        !!keyHash &&
        (!matchingKey || !!state.gumroad_unavailable || state.gumroad_check_after <= now)
    const sources: ProEntitlement["sources"] = []
    if (gumroad) sources.push("gumroad")
    if (stripe) sources.push("stripe")
    const validUntil = Math.max(
        gumroad ? state.gumroad_valid_until : 0,
        stripe ? state.stripe_pro_until : 0,
    )
    return {
        pro: sources.length > 0,
        sources,
        status: unknown && !sources.length ? "unavailable" : "verified",
        validUntil,
        refreshAfter: Math.min(
            now + DAY,
            validUntil || Infinity,
            matchingKey ? Math.max(now + RETRY_DELAY, state.gumroad_check_after) : Infinity,
        ),
    }
}

/** Reusable authorization guard. Never trusts browser flags, synced keys, or request bodies. */
export async function requirePro(db: D1Database, userId: string): Promise<Response | null> {
    const state = await db
        .prepare("SELECT * FROM sync_state WHERE user_id = ?")
        .bind(userId)
        .first<EntitlementState>()
    if (!state) return proJson({ error: "pro_required" }, 403)
    const entitlement = await resolveEntitlement(db, userId, state)
    if (entitlement.pro) return null
    return entitlement.status === "unavailable"
        ? proJson({ error: "entitlement_unavailable" }, 503)
        : proJson({ error: "pro_required" }, 403)
}

/**
 * Internal adapter for future verified Stripe billing events, NOT a public endpoint.
 * Caller must establish the account and retrieve current billing state from Stripe first.
 * Version is a local CAS token, not a Stripe event timestamp (events can arrive out of order).
 * A duplicate value does not write or bump either revision. Zero revokes only Stripe access.
 */
export async function setStripeEntitlement(
    db: D1Database,
    userId: string,
    activeUntil: number,
    expectedVersion: number,
): Promise<"updated" | "unchanged" | "conflict"> {
    if (
        !Number.isSafeInteger(activeUntil) ||
        activeUntil < 0 ||
        !Number.isSafeInteger(expectedVersion) ||
        expectedVersion < 0
    )
        throw new Error("invalid entitlement")
    const result = await db
        .prepare(
            `UPDATE sync_state
        SET stripe_pro_until = ?2, stripe_version = stripe_version + 1
        WHERE user_id = ?1 AND stripe_version = ?3 AND stripe_pro_until != ?2`,
        )
        .bind(userId, activeUntil, expectedVersion)
        .run()
    if (result.meta.changes) return "updated"
    const state = await db
        .prepare("SELECT stripe_pro_until FROM sync_state WHERE user_id = ?")
        .bind(userId)
        .first<{ stripe_pro_until: number }>()
    return state?.stripe_pro_until === activeUntil ? "unchanged" : "conflict"
}
