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

export interface Env {
    DB: D1Database
    WORKOS_CLIENT_ID: string
    WORKOS_API_KEY?: string
}

interface SyncPrompt {
    id: string
    title?: string
    text?: string
    description?: string
    tags?: string[]
    folder?: string | null
    lastChanged?: number
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
                    `INSERT INTO prompts (user_id, id, title, text, description, tags, folder, rev, updated_at, deleted_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
                     ON CONFLICT(user_id, id) DO UPDATE SET
                       title=excluded.title, text=excluded.text, description=excluded.description,
                       tags=excluded.tags, folder=excluded.folder, rev=excluded.rev,
                       updated_at=excluded.updated_at, deleted_at=NULL
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

            // Return everything changed since the client's last-seen rev.
            const changedPrompts = await env.DB.prepare(
                "SELECT * FROM prompts WHERE user_id = ? AND rev > ?",
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
            })
        }

        return json({ error: "not found" }, 404)
    },
}
