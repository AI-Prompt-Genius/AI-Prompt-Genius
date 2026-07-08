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

export interface Env {
    DB: D1Database
    WORKOS_CLIENT_ID: string
    WORKOS_API_KEY?: string
    // Bearer secret gating the /admin dashboard + API (wrangler secret put ADMIN_TOKEN).
    ADMIN_TOKEN?: string
}

interface SyncPrompt {
    id: string
    title?: string
    text?: string
    description?: string
    tags?: string[]
    folder?: string | null
    sortIndex?: number
    lastChanged?: number
}

function safeParse(s: string): Record<string, unknown> {
    try {
        const v = JSON.parse(s)
        return v && typeof v === "object" ? (v as Record<string, unknown>) : {}
    } catch {
        return {}
    }
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

            const body = (await req.json()) as {
                sinceRev?: number
                prompts?: SyncPrompt[]
                deletedPromptIds?: string[]
                folders?: string[]
                settings?: { data: Record<string, unknown>; updatedAt: number }
                // Gumroad license key. `null` = explicit deactivation (clear it); `undefined`
                // (omitted) = this device just doesn't know one, leave the account's key untouched.
                proKey?: string | null
            }

            const sinceRev = body.sinceRev ?? 0
            const revRow = await env.DB.prepare(
                "SELECT COALESCE(MAX(rev), 0) AS rev FROM prompts WHERE user_id = ?",
            )
                .bind(userId)
                .first<{ rev: number }>()
            const folderRevRow = await env.DB.prepare(
                "SELECT COALESCE(MAX(rev), 0) AS rev FROM folders WHERE user_id = ?",
            )
                .bind(userId)
                .first<{ rev: number }>()
            const nextRev = Math.max(revRow?.rev ?? 0, folderRevRow?.rev ?? 0) + 1

            // Apply incoming changes (last-writer-wins on updated_at).
            for (const p of body.prompts ?? []) {
                await env.DB.prepare(
                    `INSERT INTO prompts (user_id, id, title, text, description, tags, folder, sort_index, rev, updated_at, deleted_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
                     ON CONFLICT(user_id, id) DO UPDATE SET
                       title=excluded.title, text=excluded.text, description=excluded.description,
                       tags=excluded.tags, folder=excluded.folder, sort_index=excluded.sort_index,
                       rev=excluded.rev, updated_at=excluded.updated_at, deleted_at=NULL
                     WHERE excluded.updated_at >= prompts.updated_at`,
                )
                    .bind(
                        userId,
                        p.id,
                        p.title ?? "",
                        p.text ?? "",
                        p.description ?? "",
                        (p.tags ?? []).join(";"),
                        p.folder ?? "",
                        p.sortIndex ?? 0,
                        nextRev,
                        p.lastChanged ?? Date.now(),
                    )
                    .run()
            }
            for (const id of body.deletedPromptIds ?? []) {
                await env.DB.prepare(
                    `UPDATE prompts SET deleted_at = ?, rev = ? WHERE user_id = ? AND id = ?`,
                )
                    .bind(Date.now(), nextRev, userId, id)
                    .run()
            }
            if (body.folders) {
                // Replace-set semantics for the small folder list; tombstone the ones dropped.
                await env.DB.prepare(
                    `UPDATE folders SET deleted_at = ?, rev = ? WHERE user_id = ? AND deleted_at IS NULL`,
                )
                    .bind(Date.now(), nextRev, userId)
                    .run()
                let i = 0
                for (const name of body.folders) {
                    await env.DB.prepare(
                        `INSERT INTO folders (user_id, name, sort_index, rev, deleted_at)
                         VALUES (?, ?, ?, ?, NULL)
                         ON CONFLICT(user_id, name) DO UPDATE SET sort_index=excluded.sort_index, rev=excluded.rev, deleted_at=NULL`,
                    )
                        .bind(userId, name, i++, nextRev)
                        .run()
                }
            }

            // Account settings + Pro license (singleton row per user). Best-effort and isolated:
            // a not-yet-migrated DB (no user_settings table) must not break prompt/folder sync.
            let settingsOut: { data: Record<string, unknown>; updatedAt: number } = {
                data: {},
                updatedAt: 0,
            }
            let proKeyOut: string | null = null
            try {
                const existing = await env.DB.prepare(
                    "SELECT data, updated_at, pro_key FROM user_settings WHERE user_id = ?",
                )
                    .bind(userId)
                    .first<{ data: string; updated_at: number; pro_key: string | null }>()

                // Settings: last-writer-wins on updated_at. Pro key: STICKY — an omitted proKey
                // (undefined) keeps whatever the account already has; only an explicit null clears
                // it, so a device that never activated Pro can't wipe the account's license.
                const serverUpdatedAt = existing?.updated_at ?? 0
                const incoming = body.settings
                const winData =
                    incoming && incoming.updatedAt > serverUpdatedAt
                        ? incoming.data
                        : existing
                          ? safeParse(existing.data)
                          : {}
                const winUpdatedAt =
                    incoming && incoming.updatedAt > serverUpdatedAt
                        ? incoming.updatedAt
                        : serverUpdatedAt

                const proKey =
                    body.proKey === undefined ? (existing?.pro_key ?? null) : body.proKey

                if (incoming || body.proKey !== undefined || !existing) {
                    await env.DB.prepare(
                        `INSERT INTO user_settings (user_id, data, updated_at, pro_key)
                         VALUES (?, ?, ?, ?)
                         ON CONFLICT(user_id) DO UPDATE SET
                           data=excluded.data, updated_at=excluded.updated_at, pro_key=excluded.pro_key`,
                    )
                        .bind(userId, JSON.stringify(winData), winUpdatedAt, proKey)
                        .run()
                }
                settingsOut = { data: winData, updatedAt: winUpdatedAt }
                proKeyOut = proKey
            } catch (err) {
                console.error("settings sync skipped", err)
            }

            // Return everything changed since the client's last-seen rev.
            const changedPrompts = await env.DB.prepare(
                "SELECT * FROM prompts WHERE user_id = ? AND rev > ? ORDER BY sort_index",
            )
                .bind(userId, sinceRev)
                .all()
            const changedFolders = await env.DB.prepare(
                "SELECT name, sort_index FROM folders WHERE user_id = ? AND rev > ? AND deleted_at IS NULL ORDER BY sort_index",
            )
                .bind(userId, sinceRev)
                .all()

            return json({
                rev: nextRev,
                prompts: changedPrompts.results,
                folders: (changedFolders.results as Array<{ name: string }>).map(f => f.name),
                settings: settingsOut,
                proKey: proKeyOut,
            })
        }

        return json({ error: "not found" }, 404)
    },
}
