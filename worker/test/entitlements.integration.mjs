import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { build } from "esbuild"
import { Miniflare } from "miniflare"

const DAY = 86400000
const bundle = await build({
    entryPoints: [new URL("./entitlements-harness.ts", import.meta.url).pathname],
    bundle: true,
    format: "esm",
    platform: "browser",
    conditions: ["workerd"],
    external: ["node:async_hooks", "cloudflare:workers"],
    write: false,
})

async function harness(t, upstream = { success: true, purchase: {} }, upstreamStatus = 200) {
    let calls = 0
    const requests = []
    let body = upstream
    let status = upstreamStatus
    let onVerify = async () => {}
    const mf = new Miniflare({
        compatibilityDate: "2026-07-07",
        compatibilityFlags: ["nodejs_compat", "global_fetch_strictly_public"],
        d1Databases: { DB: "entitlements-test" },
        modules: true,
        script: bundle.outputFiles[0].text,
        outboundService: async request => {
            assert.equal(request.url, "https://api.gumroad.com/v2/licenses/verify")
            assert.equal(request.method, "POST")
            calls++
            requests.push(await request.text())
            await onVerify()
            return Response.json(body, { status })
        },
    })
    t.after(() => mf.dispose())
    const db = await mf.getD1Database("DB")
    const schema = await readFile(new URL("../schema.sql", import.meta.url), "utf8")
    for (const sql of schema.replace(/--.*$/gm, "").split(";")) {
        if (sql.trim()) await db.prepare(sql).run()
    }
    async function request(path, data = {}, user = "test-user") {
        const response = await mf.dispatchFetch(`https://test.local${path}`, {
            method: "POST",
            headers: { "content-type": "application/json", "x-test-user": user },
            body: JSON.stringify(data),
        })
        return {
            status: response.status,
            data: await response.json(),
            metrics: JSON.parse(response.headers.get("x-test-db")),
        }
    }
    async function seed(user = "test-user", key = null) {
        await db
            .prepare("INSERT INTO sync_state (user_id, protocol_version, pro_key) VALUES (?, 2, ?)")
            .bind(user, key)
            .run()
    }
    return {
        db,
        seed,
        request,
        requests,
        calls: () => calls,
        duringVerification: callback => {
            onVerify = callback
        },
        upstream: (next, code = 200) => {
            body = next
            status = code
        },
    }
}

test("free and Stripe idle sync remain one indexed row read and zero writes", async t => {
    const h = await harness(t)
    await h.seed()
    // Other accounts cannot cause a scan or leak their membership.
    for (let n = 0; n < 30; n++) await h.seed(`other-${n}`)
    const free = await h.request("/sync", { protocolVersion: 2, sinceRev: 0 })
    assert.equal(free.data.entitlement.pro, false)
    assert.deepEqual(free.metrics, { queries: 1, rowsRead: 1, rowsWritten: 0 })
    const until = Date.now() + DAY
    assert.equal((await h.request("/stripe", { until, version: 0 })).data, "updated")
    const paid = await h.request("/sync", { protocolVersion: 2, sinceRev: 0 })
    assert.deepEqual(paid.data.entitlement.sources, ["stripe"])
    assert.deepEqual(paid.metrics, { queries: 1, rowsRead: 1, rowsWritten: 0 })
    assert.equal(h.calls(), 0)
    const other = await h.request("/check", {}, "other-0")
    assert.equal(other.status, 403)
    assert.equal((await h.request("/check")).status, 200)
})

test("legacy verification is lazy, reused across sync and guards, and never increments license uses", async t => {
    const h = await harness(t)
    await h.seed("test-user", "legacy")
    const first = await h.request("/status")
    assert.deepEqual(first.data.sources, ["gumroad"])
    assert.equal(first.metrics.rowsWritten, 1)
    for (let i = 0; i < 5; i++) {
        const next = await h.request("/sync", { protocolVersion: 2, sinceRev: 0 })
        assert.deepEqual(next.metrics, { queries: 1, rowsRead: 1, rowsWritten: 0 })
    }
    assert.equal((await h.request("/check")).status, 200)
    assert.equal(h.calls(), 1)
    assert.equal(new URLSearchParams(h.requests[0]).get("increment_uses_count"), "false")
})

test("invalid client-supplied keys never grant Pro and negative checks are cached", async t => {
    const h = await harness(t, { success: false }, 404)
    await h.seed()
    const sync = await h.request("/sync", {
        protocolVersion: 2,
        proKey: "forged",
        pro: true,
        stripe_pro_until: Date.now() + DAY,
    })
    assert.equal(sync.data.entitlement.pro, false)
    const again = await h.request("/status")
    assert.equal(again.data.pro, false)
    assert.equal(again.metrics.rowsWritten, 0)
    assert.equal((await h.request("/check")).status, 403)
    assert.equal(h.calls(), 1)
})

test("license replacement invalidates the old cache and removal preserves Stripe", async t => {
    const h = await harness(t)
    await h.seed("test-user", "good")
    assert.equal((await h.request("/status")).data.pro, true)
    h.upstream({ success: false }, 404)
    const replaced = await h.request("/sync", { protocolVersion: 2, proKey: "bad" })
    assert.equal(replaced.data.entitlement.pro, false)
    await h.request("/stripe", { until: Date.now() + DAY, version: 0 })
    const removed = await h.request("/sync", { protocolVersion: 2, proKey: null })
    assert.deepEqual(removed.data.entitlement.sources, ["stripe"])
    assert.equal(h.calls(), 2)
})

test("Stripe revocation preserves legacy access; retries do not write and stale versions conflict", async t => {
    const h = await harness(t)
    await h.seed("test-user", "good")
    await h.request("/status")
    const until = Date.now() + DAY
    await h.request("/stripe", { until, version: 0 })
    const duplicate = await h.request("/stripe", { until, version: 0 })
    assert.equal(duplicate.data, "unchanged")
    assert.equal(duplicate.metrics.rowsWritten, 0)
    assert.equal((await h.request("/stripe", { until: 0, version: 0 })).data, "conflict")
    assert.equal((await h.request("/stripe", { until: 0, version: 1 })).data, "updated")
    assert.deepEqual((await h.request("/status")).data.sources, ["gumroad"])
})

test("provider failures fail closed, back off without repeated writes, and do not erase the license", async t => {
    const h = await harness(t, { success: false }, 503)
    await h.seed("test-user", "good")
    const first = await h.request("/status")
    assert.equal(first.data.status, "unavailable")
    assert.equal(first.data.pro, false)
    const again = await h.request("/check")
    assert.equal(again.status, 503)
    assert.equal(again.metrics.rowsWritten, 0)
    assert.equal(h.calls(), 1)
    assert.equal(
        (
            await h.db
                .prepare("SELECT pro_key FROM sync_state WHERE user_id = ?")
                .bind("test-user")
                .first()
        ).pro_key,
        "good",
    )
    await h.request("/stripe", { until: Date.now() + DAY, version: 0 })
    assert.deepEqual((await h.request("/status")).data.sources, ["stripe"])
})

test("expired cached licenses fail closed during outages and recover after the retry window", async t => {
    const h = await harness(t)
    await h.seed("test-user", "good")
    await h.request("/status")
    await h.db
        .prepare("UPDATE sync_state SET gumroad_valid_until = 1, gumroad_check_after = 1")
        .run()
    h.upstream({}, 500)
    assert.equal((await h.request("/check")).status, 503)
    h.upstream({ success: true, purchase: {} })
    await h.db.prepare("UPDATE sync_state SET gumroad_check_after = 1").run()
    assert.equal((await h.request("/check")).status, 200)
})

test("refunds, lost disputes and ended subscriptions revoke; cancellation alone retains access", async t => {
    for (const purchase of [
        { refunded: true },
        { disputed: true },
        { subscription_ended_at: "2020-01-01T00:00:00Z" },
    ]) {
        const h = await harness(t, { success: true, purchase })
        await h.seed("test-user", "key")
        assert.equal((await h.request("/check")).status, 403)
    }
    const h = await harness(t, {
        success: true,
        purchase: { subscription_cancelled_at: "2020-01-01", disputed: true, dispute_won: true },
    })
    await h.seed("test-user", "key")
    assert.equal((await h.request("/check")).status, 200)
})

test("Stripe access expires without a database write and account deletion removes all grants", async t => {
    const h = await harness(t)
    await h.seed()
    await h.request("/stripe", { until: 1, version: 0 })
    const expired = await h.request("/check")
    assert.equal(expired.status, 403)
    assert.equal(expired.metrics.rowsWritten, 0)
    await h.request("/stripe", { until: Date.now() + DAY, version: 1 })
    await h.request("/delete")
    assert.equal((await h.request("/check")).status, 403)
})

test("public entitlement endpoint requires authentication and exposes no client grant route", async t => {
    const h = await harness(t)
    assert.equal((await h.request("/entitlements", { pro: true })).status, 401)
    const noWrite = await h.request("/entitlements/stripe", { until: Date.now() + DAY })
    assert.equal(noWrite.status, 404)
    assert.equal(noWrite.metrics.rowsWritten, 0)
})

test("legacy schema migration preserves keys without trusting or eagerly verifying them", async t => {
    const h = await harness(t)
    await h.db.prepare("DROP TABLE sync_state").run()
    const migration6 = await readFile(
        new URL("../migrations/0006_sync_state.sql", import.meta.url),
        "utf8",
    )
    for (const sql of migration6.replace(/--.*$/gm, "").split(";")) {
        if (sql.trim()) await h.db.prepare(sql).run()
    }
    await h.seed("test-user", "legacy")
    const migration7 = await readFile(
        new URL("../migrations/0007_pro_entitlements.sql", import.meta.url),
        "utf8",
    )
    for (const sql of migration7.replace(/--.*$/gm, "").split(";")) {
        if (sql.trim()) await h.db.prepare(sql).run()
    }
    const before = await h.db
        .prepare("SELECT * FROM sync_state WHERE user_id = ?")
        .bind("test-user")
        .first()
    assert.equal(before.pro_key, "legacy")
    assert.equal(before.gumroad_valid_until, 0)
    assert.equal(before.stripe_pro_until, 0)
    assert.equal(h.calls(), 0)
    assert.equal((await h.request("/status")).data.pro, true)
})

test("near-term expiry caps cached access and malformed provider replies do not grant access", async t => {
    const until = Date.now() + 60000
    const h = await harness(t, {
        success: true,
        purchase: { subscription_ended_at: new Date(until).toISOString() },
    })
    await h.seed("test-user", "legacy")
    assert.equal((await h.request("/status")).data.validUntil, until)
    const bad = await harness(t, { success: true })
    await bad.seed("test-user", "legacy")
    assert.equal((await bad.request("/check")).status, 503)
})

test("a license removed during verification cannot be resurrected by its late response", async t => {
    const h = await harness(t)
    await h.seed("test-user", "legacy")
    h.duringVerification(async () => {
        await h.db
            .prepare("UPDATE sync_state SET pro_key = NULL WHERE user_id = ?")
            .bind("test-user")
            .run()
    })
    const result = await h.request("/check")
    assert.equal(result.status, 403)
    assert.equal(result.metrics.rowsWritten, 0)
    assert.equal((await h.request("/status")).data.pro, false)
})

test("concurrent verification refreshes persist just one result", async t => {
    const h = await harness(t)
    await h.seed("test-user", "legacy")
    let release
    const barrier = new Promise(resolve => {
        release = resolve
    })
    h.duringVerification(async () => {
        if (h.calls() === 2) release()
        await barrier
    })
    const results = await Promise.all([h.request("/check"), h.request("/check")])
    assert.ok(results.every(result => result.status === 200))
    assert.equal(
        results.reduce((sum, result) => sum + result.metrics.rowsWritten, 0),
        1,
    )
})
