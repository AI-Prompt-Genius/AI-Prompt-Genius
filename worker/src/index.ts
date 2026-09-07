// AI Prompt Genius sync Worker (Cloudflare Workers + D1), authenticated with WorkOS AuthKit.
//
// The SPA signs users in via AuthKit (hosted UI — email/password, Google, passkeys, TOTP MFA all
// configured in the WorkOS dashboard) and sends the resulting access token as
// `Authorization: Bearer <jwt>`. We validate it against the WorkOS JWKS; `sub` is the user id
// that keys the prompts/folders tables.
//
// Endpoints:
//   POST /sync  { sinceRev, prompts[], deletedPromptIds[], folders[] }  (+ bearer auth)
//               -> { rev, prompts[], folders[] }   (delta both ways)

import { createRemoteJWKSet, jwtVerify } from "jose"
import { handleAuth } from "./auth"
import { handleAdmin, handlePublicPromos } from "./admin"
import { handleLicenseVerify } from "./license"
import { handleSync } from "./sync"

export interface Env {
    DB: D1Database
    WORKOS_CLIENT_ID: string
    WORKOS_API_KEY?: string
    // Bearer secret gating the /admin dashboard + API (wrangler secret put ADMIN_TOKEN).
    ADMIN_TOKEN?: string
}

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

// Module-scoped JWKS set: cached for the isolate's lifetime; jose refetches automatically when a
// token arrives with an unknown `kid` (key rotation).
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

async function verifyWorkosToken(req: Request, env: Env): Promise<string | null> {
    const header = req.headers.get("authorization") ?? ""
    const token = header.startsWith("Bearer ") ? header.slice(7) : null
    if (!token) return null
    try {
        jwks ??= createRemoteJWKSet(
            new URL(`https://api.workos.com/sso/jwks/${env.WORKOS_CLIENT_ID}`),
        )
        const { payload } = await jwtVerify(token, jwks, {
            // AuthKit user-management tokens are issued per-client, not by the bare API origin.
            issuer: `https://api.workos.com/user_management/${env.WORKOS_CLIENT_ID}`,
        })
        return typeof payload.sub === "string" ? payload.sub : null
    } catch {
        return null
    }
}

export default {
    async fetch(req: Request, env: Env): Promise<Response> {
        if (req.method === "OPTIONS") return json({})
        const url = new URL(req.url)

        // Public promo feed the extension polls (no auth).
        if (url.pathname === "/promos" && req.method === "GET") {
            return handlePublicPromos(env)
        }

        // Pro check for the extension's background script, which has no access to the SPA's
        // localStorage and can't call Gumroad directly without a new host permission.
        if (url.pathname === "/license/verify" && req.method === "POST") {
            return handleLicenseVerify(req)
        }

        // Admin dashboard + API (gated inside handleAdmin by ADMIN_TOKEN).
        if (url.pathname.startsWith("/admin")) {
            return handleAdmin(req, env, url.pathname)
        }

        if (url.pathname.startsWith("/auth/") && req.method === "POST") {
            const userId = await verifyWorkosToken(req, env) // null for pre-auth endpoints
            return handleAuth(req, env, url.pathname, userId)
        }

        if (url.pathname === "/sync" && req.method === "POST") {
            const userId = await verifyWorkosToken(req, env)
            if (!userId) return json({ error: "unauthorized" }, 401)
            return handleSync(req, env, userId)
        }

        return json({ error: "not found" }, 404)
    },
}
