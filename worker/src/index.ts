export { McpUsage } from "./mcpUsage"
import { oauthProvider, handleMcpAuthorization, type OAuthEnv } from "./mcpOAuth"
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
import { handleLicenseVerify, proJson } from "./license"
import { resolveEntitlement, type EntitlementState } from "./entitlements"
import { handleSync } from "./sync"

export interface Env extends OAuthEnv, Pick<CloudflareBindings, "DB" | "WORKOS_CLIENT_ID"> {
    MCP_RATE_LIMITER?: CloudflareBindings["MCP_RATE_LIMITER"]
    MCP_USAGE?: CloudflareBindings["MCP_USAGE"]
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

export const application = {
    async fetch(req: Request, env: Env): Promise<Response> {
        if (req.method === "OPTIONS") return json({})
        const url = new URL(req.url)

        if (url.pathname === "/oauth/authorize" || url.pathname.startsWith("/integrations/mcp/")) {
            return handleMcpAuthorization(req, env, await verifyWorkosToken(req, env))
        }

        // Public promo feed the extension polls (no auth).
        if (url.pathname === "/promos" && req.method === "GET") {
            return handlePublicPromos(env)
        }

        // Pro check for the extension's background script, which has no access to the SPA's
        // localStorage and can't call Gumroad directly without a new host permission.
        if (
            ["/license/verify", "/license/activate"].includes(url.pathname) &&
            req.method === "POST"
        ) {
            return handleLicenseVerify(req, url.pathname === "/license/activate")
        }

        if (url.pathname === "/entitlements" && req.method === "POST") {
            const userId = await verifyWorkosToken(req, env)
            if (!userId) return proJson({ error: "unauthorized" }, 401)
            const state = await env.DB.prepare("SELECT * FROM sync_state WHERE user_id = ?")
                .bind(userId)
                .first<EntitlementState>()
            // Unsynced accounts have no server entitlement. Do not create rows on status reads.
            const entitlement = state
                ? await resolveEntitlement(env.DB, userId, state)
                : {
                      pro: false,
                      sources: [],
                      status: "verified",
                      validUntil: 0,
                      refreshAfter: Date.now() + 24 * 60 * 60 * 1000,
                  }
            return proJson(entitlement, entitlement.status === "unavailable" ? 503 : 200)
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

export default {
    async fetch(req: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
        // Existing sync/auth can still run before the new KV binding is provisioned.
        if (!env.OAUTH_KV) {
            const path = new URL(req.url).pathname
            if (
                path.startsWith("/mcp") ||
                path.startsWith("/oauth/") ||
                path.startsWith("/.well-known/") ||
                path.startsWith("/integrations/mcp/")
            ) {
                return proJson({ error: "mcp_not_configured" }, 503)
            }
            return application.fetch(req, env)
        }
        if (!ctx) throw new Error("Missing Worker execution context")
        return oauthProvider(env, application).fetch(req, env, ctx)
    },
}
