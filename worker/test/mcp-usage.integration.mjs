import assert from "node:assert/strict"
import test from "node:test"
import { build } from "esbuild"
import { Miniflare } from "miniflare"
const bundle = await build({
    entryPoints: [new URL("./mcp-usage-harness.ts", import.meta.url).pathname],
    bundle: true,
    format: "esm",
    platform: "browser",
    external: ["cloudflare:workers"],
    write: false,
})
async function harness(t, weekly = "3", monthly = "5") {
    const mf = new Miniflare({
        modules: true,
        script: bundle.outputFiles[0].text,
        compatibilityDate: "2026-07-07",
        durableObjects: { USAGE: { className: "TestMcpUsage", useSQLite: true } },
        bindings: { MCP_WEEKLY_TOOL_LIMIT: weekly, MCP_MONTHLY_TOOL_LIMIT: monthly },
    })
    t.after(() => mf.dispose())
    return async (date, account = "a", seed) => {
        const res = await mf.dispatchFetch(`https://test/${seed ? "seed" : "consume"}`, {
            method: "POST",
            headers: { "test-now": String(Date.parse(date)), account },
            body: seed ? JSON.stringify(seed) : undefined,
        })
        return res.json()
    }
}
test("account caps are atomic under concurrency and isolated across accounts", async t => {
    const call = await harness(t)
    const results = await Promise.all(Array.from({ length: 12 }, () => call("2026-09-22")))
    assert.equal(results.filter(r => r.allowed).length, 3)
    assert.deepEqual(
        results.find(r => !r.allowed),
        {
            allowed: false,
            period: "weekly",
            limit: 3,
            resetsAt: "2026-09-28T00:00:00.000Z",
        },
    )
    assert.deepEqual(await call("2026-09-22", "b"), { allowed: true })
})
test("week reset preserves monthly usage; month reset preserves current week", async t => {
    const call = await harness(t)
    for (let i = 0; i < 3; i++) assert.equal((await call("2026-09-27T23:59:59Z")).allowed, true)
    for (let i = 0; i < 2; i++) assert.equal((await call("2026-09-28")).allowed, true)
    assert.deepEqual(await call("2026-09-30T23:59:59Z"), {
        allowed: false,
        period: "monthly",
        limit: 5,
        resetsAt: "2026-10-01T00:00:00.000Z",
    })
    assert.equal((await call("2026-10-01")).allowed, true)
    assert.equal((await call("2026-10-01")).period, "weekly")
    assert.equal((await call("2026-10-05")).allowed, true)
})
test("reports later blocking reset and handles year boundaries", async t => {
    const call = await harness(t, "1", "1")
    assert.equal((await call("2026-12-31T23:59:59Z")).allowed, true)
    assert.equal((await call("2026-12-31T23:59:59Z")).resetsAt, "2027-01-04T00:00:00.000Z")
    assert.equal((await call("2027-01-01")).allowed, false)
    assert.equal((await call("2027-01-04")).allowed, true)
})
test("invalid configuration falls back to generous defaults", async t => {
    const call = await harness(t, "0", "invalid")
    await call("2026-09-22", "a", {
        week: Date.parse("2026-09-21"),
        month: Date.parse("2026-09-01"),
        weekly: 9999,
        monthly: 39999,
    })
    assert.equal((await call("2026-09-22")).allowed, true)
    assert.deepEqual(await call("2026-09-22"), {
        allowed: false,
        period: "monthly",
        limit: 40000,
        resetsAt: "2026-10-01T00:00:00.000Z",
    })
})
