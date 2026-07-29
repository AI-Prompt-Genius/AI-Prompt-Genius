const GUMROAD_VERIFY = "https://api.gumroad.com/v2/licenses/verify"
const PRODUCT_ID = "AkOGKEr0_Y0c3eZXKnTvDA=="

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "content-type": "application/json",
            "access-control-allow-origin": "*",
            "access-control-allow-headers": "content-type, authorization",
            "access-control-allow-methods": "POST, OPTIONS",
        },
    })
}

export async function handleLicenseVerify(req: Request): Promise<Response> {
    const body = (await req.json().catch(() => ({}))) as { proKey?: string }
    const proKey = typeof body.proKey === "string" ? body.proKey.trim() : ""
    if (!proKey) return json({ error: "proKey required" }, 400)

    // Upstream trouble must not read as "not a Pro user" — the caller fails closed on a
    // non-200, so a Gumroad outage leaves an existing Pro user's status untouched rather than
    // downgrading them.
    try {
        const res = await fetch(GUMROAD_VERIFY, {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: `product_id=${encodeURIComponent(PRODUCT_ID)}&license_key=${encodeURIComponent(
                proKey,
            )}&increment_uses_count=false`,
        })
        // Gumroad answers 404 with { success: false } for an unknown key — that's a real
        // verdict, not an outage, so read the body rather than trusting the status code.
        const data = (await res.json().catch(() => null)) as { success?: boolean } | null
        if (data === null) return json({ error: "upstream unavailable" }, 502)
        return json({ valid: data.success === true })
    } catch {
        return json({ error: "upstream unavailable" }, 502)
    }
}
