import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createHash, randomUUID } from "node:crypto"
import test from "node:test"
import { build } from "esbuild"
import { Miniflare } from "miniflare"
import { generateKeyPair, exportJWK, SignJWT } from "jose"

const origin = "https://mcp.example.com",
    app = "https://lib.example.com",
    endpoint = `${origin}/mcp`
const bundle = await build({
    entryPoints: [new URL("./mcp-harness.ts", import.meta.url).pathname],
    bundle: true,
    format: "esm",
    platform: "browser",
    conditions: ["workerd"],
    external: ["node:async_hooks", "cloudflare:workers"],
    write: false,
})
const { privateKey, publicKey } = await generateKeyPair("RS256")
const jwk = { ...(await exportJWK(publicKey)), kid: "test", alg: "RS256", use: "sig" }
async function accountToken(user = "a") {
    return new SignJWT({})
        .setProtectedHeader({ alg: "RS256", kid: "test" })
        .setIssuer("https://api.workos.com/user_management/test-client")
        .setSubject(user)
        .setExpirationTime("5m")
        .sign(privateKey)
}

async function harness(t, limits = {}) {
    const mf = new Miniflare({
        compatibilityDate: "2026-07-07",
        compatibilityFlags: ["nodejs_compat", "global_fetch_strictly_public"],
        modules: true,
        script: bundle.outputFiles[0].text,
        d1Databases: { DB: "mcp" },
        kvNamespaces: ["OAUTH_KV"],
        durableObjects: { MCP_USAGE: { className: "McpUsage", useSQLite: true } },
        bindings: {
            ...limits,
            WORKOS_CLIENT_ID: "test-client",
            MCP_PUBLIC_URL: endpoint,
            APP_ORIGIN: app,
        },
        outboundService: async req => {
            assert.equal(req.url, "https://api.workos.com/sso/jwks/test-client")
            return Response.json({ keys: [jwk] })
        },
    })
    t.after(() => mf.dispose())
    const db = await mf.getD1Database("DB")
    const schema = await readFile(new URL("../schema.sql", import.meta.url), "utf8")
    for (const sql of schema.replace(/--.*$/gm, "").split(";"))
        if (sql.trim()) await db.prepare(sql).run()
    for (const user of ["a", "b", "free"])
        await db
            .prepare(
                "INSERT INTO sync_state(user_id,protocol_version,stripe_pro_until) VALUES (?,2,?)",
            )
            .bind(user, user === "free" ? 0 : Date.now() + 86400000)
            .run()
    const dispatch = (path, init = {}) => mf.dispatchFetch(`${origin}${path}`, init)
    async function manage(path, body = {}, user = "a") {
        const response = await dispatch(`/integrations/mcp/${path}`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${await accountToken(user)}`,
                origin: app,
            },
            body: JSON.stringify(body),
        })
        return { status: response.status, data: await response.json() }
    }
    async function authorize(user = "a", scope = "library:read library:write library:delete") {
        const registration = await dispatch("/oauth/register", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                client_name: "Test AI client",
                redirect_uris: ["http://localhost:4444/callback"],
                grant_types: ["authorization_code", "refresh_token"],
                response_types: ["code"],
                token_endpoint_auth_method: "none",
            }),
        })
        assert.equal(registration.status, 201, await registration.clone().text())
        const client = await registration.json()
        const verifier = "a".repeat(64)
        const challenge = createHash("sha256").update(verifier).digest("base64url")
        const query = new URLSearchParams({
            client_id: client.client_id,
            redirect_uri: "http://localhost:4444/callback",
            response_type: "code",
            scope,
            resource: endpoint,
            code_challenge: challenge,
            code_challenge_method: "S256",
            state: "test-state",
        })
        const authorizationUrl = `${origin}/oauth/authorize?${query}`
        const info = await manage("authorization", { authorizationUrl }, user)
        assert.equal(info.status, 200, JSON.stringify(info.data))
        assert.equal(info.data.clientName, "Test AI client")
        const decision = await manage(
            "approve",
            { authorizationUrl, approve: true, scopes: scope.split(" ") },
            user,
        )
        if (decision.status !== 200) return { decision, authorizationUrl, client }
        const redirect = new URL(decision.data.redirectTo)
        assert.equal(redirect.searchParams.get("state"), "test-state")
        const response = await dispatch("/oauth/token", {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code: redirect.searchParams.get("code"),
                redirect_uri: "http://localhost:4444/callback",
                client_id: client.client_id,
                code_verifier: verifier,
                resource: endpoint,
            }).toString(),
        })
        assert.equal(response.status, 200, await response.clone().text())
        return { ...(await response.json()), client, authorizationUrl, decision }
    }
    async function rpc(token, method, params = {}, headers = {}) {
        const response = await dispatch("/mcp", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                host: "mcp.example.com",
                accept: "application/json, text/event-stream",
                "mcp-protocol-version": "2025-11-25",
                ...(token ? { authorization: `Bearer ${token}` } : {}),
                ...headers,
            },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        })
        const text = await response.text()
        let data
        try {
            data = text
                ? JSON.parse(
                      text.startsWith("event:")
                          ? text
                                .split("\n")
                                .filter(line => line.startsWith("data: "))
                                .at(-1)
                                .slice(6)
                          : text,
                  )
                : {}
        } catch {
            throw new Error(`Expected JSON (${response.status}): ${text.slice(0, 1500)}`)
        }
        return { status: response.status, data, headers: response.headers }
    }
    async function tool(token, name, args = {}) {
        const result = await rpc(token, "tools/call", { name, arguments: args })
        let value = null
        const text = result.data.result?.content?.[0]?.text
        if (text) {
            try {
                value = JSON.parse(text)
            } catch {
                value = { message: text }
            }
        }
        return { ...result, value, isError: result.data.result?.isError }
    }
    return { db, dispatch, manage, authorize, rpc, tool }
}
const write = (revision, extra = {}) => ({
    expectedRevision: revision,
    requestId: randomUUID(),
    ...extra,
})

// These tests exercise the real Worker, OAuth code+PKCE exchange, MCP transport and local D1.
test("OAuth discovery, Pro lock, scoped tools, and immediate disconnect", async t => {
    const h = await harness(t)
    const unauthorized = await h.rpc(null, "tools/list")
    assert.equal(unauthorized.status, 401)
    assert.match(unauthorized.headers.get("www-authenticate"), /resource_metadata/)
    const metadata = await h.dispatch("/.well-known/oauth-protected-resource/mcp")
    assert.equal((await metadata.json()).resource, endpoint)
    const free = await h.authorize("free")
    assert.equal(free.decision.status, 403)
    const auth = await h.authorize("a", "library:read")
    const token = auth.access_token
    const init = await h.rpc(token, "initialize", {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "test", version: "1" },
    })
    assert.equal(init.status, 200, JSON.stringify(init.data))
    const listed = await h.rpc(token, "tools/list")
    assert.deepEqual(listed.data.result.tools.map(tool => tool.name).sort(), [
        "fetch_prompts",
        "list_folders",
    ])
    const denied = await h.tool(
        token,
        "create_prompts",
        write(0, { prompts: [{ id: "x", title: "x", text: "x" }] }),
    )
    assert.ok(denied.data.error || denied.isError)
    assert.equal(
        (await h.rpc(token, "tools/list", {}, { origin: "https://evil.example" })).status,
        403,
    )
    await h.manage("disconnect")
    assert.equal((await h.rpc(token, "tools/list")).status, 403)
})

test("bulk CRUD, prompt ordering, folder creation/rename/reorder/delete converge through sync", async t => {
    const h = await harness(t),
        auth = await h.authorize(),
        token = auth.access_token
    const folders = await h.tool(token, "create_folders", write(0, { names: ["Work", "Personal"] }))
    assert.equal(folders.isError, undefined, JSON.stringify(folders))
    assert.ok(folders.value, JSON.stringify(folders))
    assert.equal(folders.value.revision, 1)
    const creation = write(1, {
        prompts: [
            { id: "p1", title: "One", text: "Hello {{name}}", folder: "Work", tags: ["one"] },
            { id: "p2", title: "Two", text: "second", folder: "Work" },
        ],
    })
    const created = await h.tool(token, "create_prompts", creation)
    assert.equal(created.value.affected, 2, JSON.stringify(created))
    assert.equal(created.value.revision, 2)
    const replay = await h.tool(token, "create_prompts", creation)
    assert.equal(replay.value.replayed, true)
    assert.equal(replay.value.revision, 2)
    const updated = await h.tool(
        token,
        "update_prompts",
        write(2, { prompts: [{ id: "p1", title: "Updated" }] }),
    )
    assert.equal(updated.value.revision, 3)
    const reordered = await h.tool(
        token,
        "reorder_prompts",
        write(3, {
            positions: [
                { id: "p2", sortIndex: -10 },
                { id: "p1", sortIndex: 10 },
            ],
        }),
    )
    assert.equal(reordered.value.revision, 4)
    const renamed = await h.tool(token, "rename_folder", write(4, { from: "Work", to: "Business" }))
    assert.equal(renamed.value.revision, 5)
    const folderOrder = await h.tool(
        token,
        "reorder_folders",
        write(5, { names: ["Personal", "Business"] }),
    )
    assert.equal(folderOrder.value.revision, 6)
    const fetched = await h.tool(token, "fetch_prompts", { ids: ["p1", "p2"] })
    assert.equal(fetched.value.prompts.find(p => p.id === "p1").text, "Hello {{name}}")
    assert.ok(fetched.value.prompts.every(p => p.folder === "Business"))
    const preview = await h.tool(
        token,
        "delete_folders",
        write(6, { names: ["Business"], dryRun: true }),
    )
    assert.equal(preview.value.affectedPrompts, 2)
    assert.equal(preview.value.revision, 6)
    const removed = await h.tool(token, "delete_folders", write(6, { names: ["Business"] }))
    assert.equal(removed.value.revision, 7)
    const unfiled = await h.tool(token, "fetch_prompts", {})
    assert.ok(unfiled.value.prompts.every(p => p.folder === null))
    const deleted = await h.tool(token, "delete_prompts", write(7, { ids: ["p1", "p2"] }))
    assert.equal(deleted.value.revision, 8)
    const response = await h.dispatch("/sync", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${await accountToken()}`,
        },
        body: JSON.stringify({ protocolVersion: 2, sinceRev: 0 }),
    })
    const sync = await response.json()
    assert.equal(sync.rev, 8)
    assert.deepEqual(sync.folders, ["Personal"])
    assert.ok(sync.prompts.every(p => p.deleted_at > 0))
})

test("account isolation, validation, optimistic conflicts, and idempotency key reuse", async t => {
    const h = await harness(t),
        a = (await h.authorize()).access_token,
        b = (await h.authorize("b")).access_token
    const args = write(0, { prompts: [{ id: "private", title: "Secret", text: "private text" }] })
    assert.equal((await h.tool(a, "create_prompts", args)).value.revision, 1)
    assert.equal((await h.tool(b, "fetch_prompts", { ids: ["private"] })).value.error, "not_found")
    assert.equal(
        (
            await h.tool(
                b,
                "update_prompts",
                write(0, { prompts: [{ id: "private", text: "attack" }] }),
            )
        ).value.error,
        "not_found",
    )
    const stale = await h.tool(
        a,
        "update_prompts",
        write(0, { prompts: [{ id: "private", text: "stale" }] }),
    )
    assert.equal(stale.value.error, "revision_conflict")
    const reused = await h.tool(a, "create_prompts", {
        ...args,
        prompts: [{ id: "different", title: "x", text: "x" }],
    })
    assert.equal(reused.value.error, "request_id_reused")
    const invalid = await h.tool(
        a,
        "update_prompts",
        write(1, {
            prompts: [
                { id: "private", title: "Oops" },
                { id: "missing", title: "Oops" },
            ],
        }),
    )
    assert.equal(invalid.value.error, "not_found")
    const read = await h.tool(a, "fetch_prompts", { ids: ["private"] })
    assert.equal(read.value.prompts[0].title, "Secret")
    const inject = await h.tool(a, "list_folders", { userId: "b" })
    assert.ok(inject.data.error || inject.isError)
    await h.db.prepare("UPDATE sync_state SET stripe_pro_until=0 WHERE user_id='a'").run()
    assert.equal((await h.rpc(a, "tools/list")).status, 403)
})

test("pagination detects concurrent edits, including unicode folder cursors", async t => {
    const h = await harness(t),
        token = (await h.authorize()).access_token
    await h.tool(token, "create_folders", write(0, { names: ["日本語"] }))
    await h.tool(
        token,
        "create_prompts",
        write(1, {
            prompts: [
                { id: "p1", title: "1", text: "one", folder: "日本語" },
                { id: "p2", title: "2", text: "two", folder: "日本語" },
            ],
        }),
    )
    const first = await h.tool(token, "fetch_prompts", { limit: 1, folder: "日本語" })
    assert.equal(first.value.prompts.length, 1)
    assert.ok(first.value.nextCursor)
    const second = await h.tool(token, "fetch_prompts", {
        limit: 1,
        folder: "日本語",
        cursor: first.value.nextCursor,
    })
    assert.equal(second.value.prompts[0].id, "p2")
    assert.equal(second.value.nextCursor, null)
    await h.tool(token, "update_prompts", write(2, { prompts: [{ id: "p2", title: "changed" }] }))
    assert.equal(
        (await h.tool(token, "fetch_prompts", { cursor: first.value.nextCursor, folder: "日本語" }))
            .value.error,
        "revision_conflict",
    )
})

test("concurrent writes have one winner, and identical updates do not advance revisions", async t => {
    const h = await harness(t),
        token = (await h.authorize()).access_token
    const writes = await Promise.all([
        h.tool(
            token,
            "create_prompts",
            write(0, { prompts: [{ id: "one", title: "one", text: "one" }] }),
        ),
        h.tool(
            token,
            "create_prompts",
            write(0, { prompts: [{ id: "two", title: "two", text: "two" }] }),
        ),
    ])
    assert.equal(writes.filter(r => r.value.revision === 1).length, 1)
    assert.equal(writes.filter(r => r.value.error === "revision_conflict").length, 1)
    const fetched = await h.tool(token, "fetch_prompts")
    assert.equal(fetched.value.prompts.length, 1)
    const prompt = fetched.value.prompts[0]
    const unchanged = await h.tool(
        token,
        "update_prompts",
        write(1, { prompts: [{ id: prompt.id, title: prompt.title }] }),
    )
    assert.equal(unchanged.value.affected, 0)
    assert.equal(unchanged.value.revision, 1)
})

test("moving prompts and explicitly deleting folder contents creates sync tombstones", async t => {
    const h = await harness(t),
        token = (await h.authorize()).access_token
    await h.tool(token, "create_folders", write(0, { names: ["A", "B"] }))
    await h.tool(
        token,
        "create_prompts",
        write(1, { prompts: [{ id: "p", title: "p", text: "p", folder: "A" }] }),
    )
    await h.tool(token, "move_prompts", write(2, { ids: ["p"], folder: "B" }))
    assert.equal(
        (await h.tool(token, "fetch_prompts", { ids: ["p"] })).value.prompts[0].folder,
        "B",
    )
    const badOrder = await h.tool(token, "reorder_folders", write(3, { names: ["A"] }))
    assert.equal(badOrder.value.error, "invalid_folder_order")
    const collision = await h.tool(token, "rename_folder", write(3, { from: "A", to: "B" }))
    assert.equal(collision.value.error, "folder_exists")
    await h.tool(token, "delete_folders", write(3, { names: ["B"], deleteContents: true }))
    const row = await h.db.prepare("SELECT * FROM prompts WHERE user_id='a' AND id='p'").first()
    assert.ok(row.deleted_at > 0)
    assert.equal(row.rev, 4)
    assert.equal((await h.tool(token, "fetch_prompts")).value.prompts.length, 0)
})

test("OAuth refresh cannot regain scopes and disconnected refresh tokens stay blocked", async t => {
    const h = await harness(t),
        auth = await h.authorize()
    const refreshed = await h.dispatch("/oauth/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: auth.client.client_id,
            refresh_token: auth.refresh_token,
            scope: "library:read",
            resource: endpoint,
        }).toString(),
    })
    assert.equal(refreshed.status, 200, await refreshed.clone().text())
    const token = await refreshed.json()
    const tools = await h.rpc(token.access_token, "tools/list")
    assert.deepEqual(tools.data.result.tools.map(t => t.name).sort(), [
        "fetch_prompts",
        "list_folders",
    ])
    await h.manage("disconnect")
    const again = await h.dispatch("/oauth/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: auth.client.client_id,
            refresh_token: token.refresh_token,
            resource: endpoint,
        }).toString(),
    })
    if (again.ok)
        assert.equal((await h.rpc((await again.json()).access_token, "tools/list")).status, 403)
})

test("authorization refuses unregistered redirects and missing PKCE; deny issues no access", async t => {
    const h = await harness(t),
        auth = await h.authorize()
    const invalid = new URL(auth.authorizationUrl)
    invalid.searchParams.set("redirect_uri", "https://evil.example/callback")
    assert.equal(
        (
            await h.manage("approve", {
                authorizationUrl: invalid.toString(),
                approve: true,
                scopes: ["library:read"],
            })
        ).status,
        400,
    )
    invalid.searchParams.set("redirect_uri", "http://localhost:4444/callback")
    invalid.searchParams.delete("code_challenge")
    assert.equal(
        (await h.manage("authorization", { authorizationUrl: invalid.toString() })).status,
        400,
    )
    const denied = await h.manage("approve", {
        authorizationUrl: auth.authorizationUrl,
        approve: false,
    })
    assert.equal(new URL(denied.data.redirectTo).searchParams.get("error"), "access_denied")
    assert.equal(new URL(denied.data.redirectTo).searchParams.get("code"), null)
})

test("a failed bulk transaction rolls back revision, prompt rows, and retry receipt", async t => {
    const h = await harness(t),
        token = (await h.authorize()).access_token
    await h.db
        .prepare(
            "CREATE TRIGGER reject_test BEFORE INSERT ON prompts WHEN NEW.id='reject' BEGIN SELECT RAISE(ABORT,'test failure'); END",
        )
        .run()
    const args = write(0, {
        prompts: [
            { id: "first", title: "First", text: "ok" },
            { id: "reject", title: "Reject", text: "fail" },
        ],
    })
    const failed = await h.tool(token, "create_prompts", args)
    assert.equal(failed.value.error, "internal_error")
    assert.equal(
        (await h.db.prepare("SELECT rev FROM sync_state WHERE user_id='a'").first()).rev,
        0,
    )
    assert.equal(
        (await h.db.prepare("SELECT COUNT(*) AS n FROM prompts WHERE user_id='a'").first()).n,
        0,
    )
    assert.equal(
        (await h.db.prepare("SELECT COUNT(*) AS n FROM mcp_mutations WHERE user_id='a'").first()).n,
        0,
    )
    await h.db.prepare("DROP TRIGGER reject_test").run()
    assert.equal((await h.tool(token, "create_prompts", args)).value.revision, 1)
})

test("usage caps stay hidden until reached, are shared across clients, and prevent writes", async t => {
    const h = await harness(t, { MCP_WEEKLY_TOOL_LIMIT: "2", MCP_MONTHLY_TOOL_LIMIT: "20" })
    const first = await h.authorize("a")
    const second = await h.authorize("a")
    const other = await h.authorize("b")
    for (let i = 0; i < 3; i++)
        assert.equal((await h.rpc(first.access_token, "tools/list")).status, 200)
    const invalid = await h.tool(first.access_token, "list_folders", { unexpected: true })
    assert.ok(invalid.isError || invalid.data.error)
    const read = await h.tool(first.access_token, "list_folders")
    assert.equal(read.isError, undefined)
    assert.deepEqual(Object.keys(read.value).sort(), ["folders", "revision"])
    assert.equal(read.headers.get("x-ratelimit-remaining"), null)
    assert.equal(
        (await h.tool(second.access_token, "create_folders", write(0, { names: ["One", "Two"] })))
            .isError,
        undefined,
    )
    const blocked = await h.tool(
        first.access_token,
        "create_folders",
        write(1, { names: ["Blocked"] }),
    )
    assert.equal(blocked.isError, true)
    assert.equal(blocked.value.error, "usage_limit_reached")
    assert.equal(blocked.value.details.period, "weekly")
    assert.ok(Date.parse(blocked.value.details.resetsAt) > Date.now())
    const row = await h.db.prepare("SELECT rev, folders FROM sync_state WHERE user_id='a'").first()
    assert.equal(row.rev, 1)
    assert.ok(!row.folders.includes("Blocked"))
    assert.equal((await h.tool(other.access_token, "list_folders")).isError, undefined)
    assert.equal((await h.rpc(first.access_token, "tools/list")).status, 200)
})

test("existing folder identifiers retain whitespace and long names across tools", async t => {
    const h = await harness(t)
    const auth = await h.authorize()
    const token = auth.access_token
    const long = "Folder".repeat(50)
    await h.db
        .prepare("UPDATE sync_state SET folders=? WHERE user_id='a'")
        .bind(JSON.stringify([" Work ", "Work", long]))
        .run()
    let result = await h.tool(
        token,
        "create_prompts",
        write(0, {
            prompts: [
                { id: "spaced", title: "Spaced", text: "text", folder: " Work " },
                { id: "plain", title: "Plain", text: "text", folder: "Work" },
            ],
        }),
    )
    assert.equal(result.isError, undefined)
    result = await h.tool(token, "fetch_prompts", { folder: " Work " })
    assert.deepEqual(
        result.value.prompts.map(p => p.id),
        ["spaced"],
    )
    result = await h.tool(token, "reorder_folders", write(1, { names: [long, "Work", " Work "] }))
    assert.equal(result.isError, undefined)
    result = await h.tool(token, "rename_folder", write(2, { from: " Work ", to: "Renamed" }))
    assert.equal(result.isError, undefined)
    result = await h.tool(token, "delete_folders", write(3, { names: [long, "Renamed"] }))
    assert.equal(result.isError, undefined)
    result = await h.tool(token, "fetch_prompts", { ids: ["spaced", "plain"] })
    assert.equal(result.value.prompts.find(p => p.id === "spaced").folder, null)
    assert.equal(result.value.prompts.find(p => p.id === "plain").folder, "Work")
})
