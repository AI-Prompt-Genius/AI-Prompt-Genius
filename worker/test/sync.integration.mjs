import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { build } from "esbuild"
import { Miniflare, createFetchMock } from "miniflare"

async function createHarness() {
    const bundle = await build({
        entryPoints: [new URL("./sync-harness.ts", import.meta.url).pathname],
        bundle: true,
        format: "esm",
        platform: "browser",
        write: false,
    })
    const fetchMock = createFetchMock()
    fetchMock.disableNetConnect()
    fetchMock
        .get("https://api.gumroad.com")
        .intercept({ path: "/v2/licenses/verify", method: "POST" })
        .reply(200, JSON.stringify({ success: true, purchase: {} }))
        .persist()
    const mf = new Miniflare({
        fetchMock,
        compatibilityDate: "2026-07-07",
        d1Databases: { DB: "sync-test" },
        modules: true,
        script: bundle.outputFiles[0].text,
    })
    const db = await mf.getD1Database("DB")
    const schema = await readFile(new URL("../schema.sql", import.meta.url), "utf8")
    for (const statement of schema.replace(/--.*$/gm, "").split(";")) {
        if (statement.trim()) await db.prepare(statement).run()
    }

    async function sync(payload) {
        const response = await mf.dispatchFetch("https://example.test/sync", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
        })
        assert.equal(response.status, 200)
        return response.json()
    }

    return { db, mf, sync }
}

test("idle syncs are read-only and mutations are idempotent", async t => {
    const { db, mf, sync } = await createHarness()
    t.after(() => mf.dispose())

    const initial = await sync({
        protocolVersion: 2,
        sinceRev: 0,
        prompts: [],
        deletedPromptIds: [],
    })
    assert.equal(initial.rev, 0)

    const changed = await sync({
        protocolVersion: 2,
        sinceRev: 0,
        prompts: [
            {
                id: "p1",
                title: "One",
                text: "Text",
                tags: ["a"],
                sortIndex: 0,
                lastChanged: 100,
            },
        ],
        folderState: { names: ["Work", "Later"], updatedAt: 100 },
        settings: { data: { lng: "en" }, updatedAt: 100 },
        proKey: "license",
    })
    assert.equal(changed.rev, 1)
    assert.deepEqual(changed.folders, ["Work", "Later"])
    assert.equal(changed.prompts.length, 1)

    const retry = await sync({
        protocolVersion: 2,
        sinceRev: 1,
        prompts: [
            {
                id: "p1",
                title: "One",
                text: "Text",
                tags: ["a"],
                sortIndex: 0,
                lastChanged: 100,
            },
        ],
        folderState: { names: ["Work", "Later"], updatedAt: 100 },
        settings: { data: { lng: "en" }, updatedAt: 100 },
        proKey: "license",
    })
    assert.equal(retry.rev, 1)
    assert.deepEqual(
        retry.prompts.map(prompt => prompt.id),
        ["p1"],
    )

    const idle = await sync({
        protocolVersion: 2,
        sinceRev: 1,
        prompts: [],
        deletedPromptIds: [],
    })
    assert.equal(idle.rev, 1)
    assert.deepEqual(idle.prompts, [])

    const stored = await db
        .prepare(
            "SELECT rev, protocol_version, folders, settings_data, pro_key FROM sync_state WHERE user_id = ?",
        )
        .bind("test-user")
        .first()
    assert.equal(stored.rev, 1)
    assert.equal(stored.protocol_version, 2)
    assert.equal(stored.folders, '["Work","Later"]')
    assert.equal(stored.settings_data, '{"lng":"en"}')
    assert.equal(stored.pro_key, "license")
})

test("folder deletion, prompt deletion, and an ahead client revision converge", async t => {
    const { db, mf, sync } = await createHarness()
    t.after(() => mf.dispose())

    const created = await sync({
        protocolVersion: 2,
        sinceRev: 0,
        prompts: [{ id: "p1", title: "One", tags: [], lastChanged: 100 }],
        folderState: { names: ["Work"], updatedAt: 100 },
    })
    assert.equal(created.rev, 1)

    const aheadIdle = await sync({
        protocolVersion: 2,
        sinceRev: 99,
        prompts: [],
        deletedPromptIds: [],
    })
    assert.equal(aheadIdle.rev, 1)
    assert.deepEqual(
        aheadIdle.prompts.map(prompt => prompt.id),
        ["p1"],
    )

    const deletedFolder = await sync({
        protocolVersion: 2,
        sinceRev: 1,
        prompts: [],
        deletedPromptIds: [],
        folderState: { names: [], updatedAt: 200 },
    })
    assert.equal(deletedFolder.rev, 2)
    assert.deepEqual(deletedFolder.folderState.names, [])

    const deletedPrompt = await sync({
        protocolVersion: 2,
        sinceRev: 2,
        prompts: [],
        deletedPromptIds: ["p1"],
    })
    assert.equal(deletedPrompt.rev, 3)
    assert.equal(deletedPrompt.prompts[0].deleted_at > 0, true)

    const deleteRetry = await sync({
        protocolVersion: 2,
        sinceRev: 3,
        prompts: [],
        deletedPromptIds: ["p1"],
    })
    assert.equal(deleteRetry.rev, 3)

    const repaired = await sync({
        protocolVersion: 2,
        sinceRev: 99,
        prompts: [{ id: "p2", title: "Two", tags: [], lastChanged: 300 }],
        deletedPromptIds: [],
    })
    assert.equal(repaired.rev, 4)
    assert.deepEqual(repaired.prompts.map(prompt => prompt.id).sort(), ["p1", "p2"])

    const staleResurrection = await sync({
        protocolVersion: 2,
        sinceRev: 4,
        prompts: [{ id: "p1", title: "Old", tags: [], lastChanged: 100 }],
        deletedPromptIds: [],
    })
    assert.equal(staleResurrection.rev, 4)
    const tombstone = await db
        .prepare("SELECT deleted_at FROM prompts WHERE user_id = ? AND id = ?")
        .bind("test-user", "p1")
        .first()
    assert.equal(tombstone.deleted_at > 0, true)
})

test("legacy unchanged singleton payloads no longer bump the revision", async t => {
    const { mf, sync } = await createHarness()
    t.after(() => mf.dispose())

    const created = await sync({
        sinceRev: 0,
        prompts: [],
        folders: ["Work"],
        settings: { data: { theme: "dark" }, updatedAt: 100 },
        proKey: "license",
    })
    assert.equal(created.rev, 1)

    const unchanged = await sync({
        sinceRev: 1,
        prompts: [],
        deletedPromptIds: [],
        folders: ["Work"],
        settings: { data: { theme: "dark" }, updatedAt: 100 },
        proKey: "license",
    })
    assert.equal(unchanged.rev, 1)
    assert.deepEqual(unchanged.prompts, [])
})

test("a legacy prompt without a timestamp is idempotent", async t => {
    const { db, mf, sync } = await createHarness()
    t.after(() => mf.dispose())

    const payload = {
        protocolVersion: 2,
        sinceRev: 0,
        prompts: [{ id: "legacy", title: "Imported", tags: [] }],
        deletedPromptIds: [],
    }
    const created = await sync(payload)
    assert.equal(created.rev, 1)

    const retry = await sync({ ...payload, sinceRev: 1 })
    assert.equal(retry.rev, 1)

    const stored = await db
        .prepare("SELECT updated_at FROM prompts WHERE user_id = ? AND id = ?")
        .bind("test-user", "legacy")
        .first()
    assert.equal(stored.updated_at, 0)
})

test("a v2 upgrade preserves its dirty fallback, then blocks legacy resurrection", async t => {
    const { db, mf, sync } = await createHarness()
    t.after(() => mf.dispose())

    const legacyCreated = await sync({ sinceRev: 0, prompts: [], folders: ["Work"] })
    assert.equal(legacyCreated.rev, 1)

    const upgraded = await sync({
        protocolVersion: 2,
        sinceRev: 1,
        prompts: [],
        folders: ["Work", "Local"],
    })
    assert.equal(upgraded.rev, 2)
    assert.deepEqual(upgraded.folders, ["Work", "Local"])

    const versionedDelete = await sync({
        protocolVersion: 2,
        sinceRev: 2,
        prompts: [],
        folderState: { names: [], updatedAt: Date.now() + 1_000 },
    })
    assert.equal(versionedDelete.rev, 3)
    assert.deepEqual(versionedDelete.folders, [])

    const staleLegacy = await sync({ sinceRev: 3, prompts: [], folders: ["Work"] })
    assert.equal(staleLegacy.rev, 3)
    assert.deepEqual(staleLegacy.folders, [])

    const state = await db
        .prepare("SELECT protocol_version, folders FROM sync_state WHERE user_id = ?")
        .bind("test-user")
        .first()
    assert.equal(state.protocol_version, 2)
    assert.equal(state.folders, "[]")
})
