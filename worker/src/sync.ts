// D1 sync protocol. A singleton sync_state row is the cheap version check for an account: an idle
// request reads exactly that row and returns without touching prompts or issuing a write.

export interface SyncEnv {
    DB: D1Database
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

interface FolderStatePayload {
    names: string[]
    updatedAt: number
}

interface SyncStateRow {
    rev: number
    protocol_version: number
    folders: string
    folders_updated_at: number
    settings_data: string
    settings_updated_at: number
    pro_key: string | null
}

interface NormalizedPrompt {
    id: string
    title: string
    text: string
    description: string
    tags: string
    folder: string
    sortIndex: number
    updatedAt: number
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

function safeObject(s: string): Record<string, unknown> {
    try {
        const value = JSON.parse(s)
        return value && typeof value === "object" && !Array.isArray(value)
            ? (value as Record<string, unknown>)
            : {}
    } catch {
        return {}
    }
}

function safeFolders(s: string): string[] {
    try {
        const value = JSON.parse(s)
        return Array.isArray(value)
            ? Array.from(new Set(value.filter(name => typeof name === "string")))
            : []
    } catch {
        return []
    }
}

function finiteNumber(value: unknown, fallback: number): number {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function normalizePrompts(prompts: SyncPrompt[] | undefined): NormalizedPrompt[] {
    const byId = new Map<string, NormalizedPrompt>()
    for (const prompt of Array.isArray(prompts) ? prompts : []) {
        if (!prompt || typeof prompt.id !== "string" || prompt.id.length === 0) continue
        byId.set(prompt.id, {
            id: prompt.id,
            title: typeof prompt.title === "string" ? prompt.title : "",
            text: typeof prompt.text === "string" ? prompt.text : "",
            description: typeof prompt.description === "string" ? prompt.description : "",
            tags: Array.isArray(prompt.tags)
                ? prompt.tags.filter(tag => typeof tag === "string").join(";")
                : "",
            folder: typeof prompt.folder === "string" ? prompt.folder : "",
            sortIndex: finiteNumber(prompt.sortIndex, 0),
            // Missing legacy timestamps sort behind any real edit and remain stable across retries.
            // Using Date.now() here would turn the same malformed/legacy payload into a write on
            // every request.
            updatedAt: finiteNumber(prompt.lastChanged, 0),
        })
    }
    return Array.from(byId.values())
}

function normalizeFolderState(value: unknown): FolderStatePayload | undefined {
    if (!value || typeof value !== "object") return undefined
    const candidate = value as { names?: unknown; updatedAt?: unknown }
    if (!Array.isArray(candidate.names)) return undefined
    const updatedAt = finiteNumber(candidate.updatedAt, 0)
    if (updatedAt <= 0) return undefined
    return {
        names: Array.from(new Set(candidate.names.filter(name => typeof name === "string"))),
        updatedAt,
    }
}

async function createStateIfMissing(
    env: SyncEnv,
    userId: string,
    protocolVersion: number,
): Promise<SyncStateRow> {
    const legacy = await env.DB.batch([
        env.DB.prepare("SELECT COALESCE(MAX(rev), 0) AS rev FROM prompts WHERE user_id = ?").bind(
            userId,
        ),
        env.DB.prepare(
            "SELECT name FROM folders WHERE user_id = ? AND deleted_at IS NULL ORDER BY sort_index",
        ).bind(userId),
        env.DB.prepare(
            "SELECT data, updated_at, pro_key FROM user_settings WHERE user_id = ?",
        ).bind(userId),
    ])
    const rev = Number((legacy[0].results?.[0] as { rev?: number } | undefined)?.rev ?? 0)
    const folders = (legacy[1].results ?? []).map(row => String((row as { name: string }).name))
    const settings = legacy[2].results?.[0] as
        | { data?: string; updated_at?: number; pro_key?: string | null }
        | undefined

    await env.DB.prepare(
        `INSERT INTO sync_state
           (user_id, rev, protocol_version, folders, folders_updated_at,
            settings_data, settings_updated_at, pro_key)
         VALUES (?, ?, ?, ?, 0, ?, ?, ?)
         ON CONFLICT(user_id) DO NOTHING`,
    )
        .bind(
            userId,
            rev,
            protocolVersion,
            JSON.stringify(folders),
            settings?.data ?? "{}",
            Number(settings?.updated_at ?? 0),
            settings?.pro_key ?? null,
        )
        .run()

    const state = await env.DB.prepare(
        `SELECT rev, protocol_version, folders, folders_updated_at,
                settings_data, settings_updated_at, pro_key
         FROM sync_state WHERE user_id = ?`,
    )
        .bind(userId)
        .first<SyncStateRow>()
    if (!state) throw new Error("failed to initialize sync state")
    return state
}

function stateResponse(state: SyncStateRow, prompts: unknown[] = []): Response {
    const folders = safeFolders(state.folders)
    return json({
        protocolVersion: 2,
        rev: state.rev,
        prompts,
        // Keep the legacy array while current clients roll out; folderState is authoritative for
        // new clients and carries the timestamp needed to propagate deletions without resurrection.
        folders,
        folderState: { names: folders, updatedAt: state.folders_updated_at },
        settings: {
            data: safeObject(state.settings_data),
            updatedAt: state.settings_updated_at,
        },
        proKey: state.pro_key,
    })
}

export async function handleSync(req: Request, env: SyncEnv, userId: string): Promise<Response> {
    const body = (await req.json()) as {
        protocolVersion?: number
        sinceRev?: number
        prompts?: SyncPrompt[]
        deletedPromptIds?: string[]
        // Legacy clients send the complete folder list on every request.
        folders?: string[]
        folderState?: FolderStatePayload
        settings?: { data: Record<string, unknown>; updatedAt: number }
        proKey?: string | null
    }

    const requestedProtocol = finiteNumber(body.protocolVersion, 1) >= 2 ? 2 : 1
    const isVersionedClient = requestedProtocol >= 2
    const requestedRev = Math.max(0, finiteNumber(body.sinceRev, 0))
    const incomingPrompts = normalizePrompts(body.prompts)
    const deletedIds = Array.from(
        new Set(
            (Array.isArray(body.deletedPromptIds) ? body.deletedPromptIds : []).filter(
                id => typeof id === "string" && id.length > 0,
            ),
        ),
    )

    let state = await env.DB.prepare(
        `SELECT rev, protocol_version, folders, folders_updated_at,
                settings_data, settings_updated_at, pro_key
         FROM sync_state WHERE user_id = ?`,
    )
        .bind(userId)
        .first<SyncStateRow>()
    if (!state) state = await createStateIfMissing(env, userId, requestedProtocol)

    // Old releases have no folder timestamp. Accept a changed legacy list only from a client that
    // has seen the current revision; stale legacy devices first pull the authoritative list.
    const currentFolders = safeFolders(state.folders)
    const currentFoldersJson = JSON.stringify(currentFolders)
    let incomingFolders = isVersionedClient ? normalizeFolderState(body.folderState) : undefined
    let hasLegacyFolderPush = false
    // A v2 client includes a dirty legacy fallback while negotiating with a possibly-v1 Worker.
    // Accept it only as part of the one-way account upgrade; after protocol_version reaches 2,
    // every legacy/fallback snapshot is permanently ignored so it cannot resurrect a deletion.
    if (!incomingFolders && Array.isArray(body.folders)) {
        const legacyNames = Array.from(
            new Set(body.folders.filter(name => typeof name === "string")),
        )
        if (
            state.protocol_version < 2 &&
            JSON.stringify(legacyNames) !== currentFoldersJson &&
            requestedRev >= state.rev
        ) {
            incomingFolders = { names: legacyNames, updatedAt: Date.now() }
            hasLegacyFolderPush = true
        }
    }

    const incomingSettings =
        body.settings &&
        body.settings.data &&
        typeof body.settings.data === "object" &&
        !Array.isArray(body.settings.data) &&
        finiteNumber(body.settings.updatedAt, 0) > state.settings_updated_at
            ? {
                  data: body.settings.data,
                  updatedAt: finiteNumber(body.settings.updatedAt, 0),
              }
            : undefined
    const hasProPush =
        Object.prototype.hasOwnProperty.call(body, "proKey") &&
        (typeof body.proKey === "string" || body.proKey === null) &&
        body.proKey !== state.pro_key
    const hasFolderPush = !!incomingFolders && incomingFolders.updatedAt > state.folders_updated_at
    const hasProtocolUpgrade = requestedProtocol > state.protocol_version

    const hasCandidateMutation =
        incomingPrompts.length > 0 ||
        deletedIds.length > 0 ||
        !!incomingSettings ||
        hasProPush ||
        hasFolderPush ||
        hasProtocolUpgrade
    // An ahead cursor can only come from the legacy phantom-revision bug or corrupted local state.
    // Recover with a full snapshot; merely lowering the cursor to state.rev would skip every row.
    const effectiveSinceRev = hasProtocolUpgrade || requestedRev > state.rev ? -1 : requestedRev

    // This is the common path: one indexed row read, no write and no prompt-table read.
    if (!hasCandidateMutation && effectiveSinceRev === state.rev) return stateResponse(state)

    if (hasCandidateMutation) {
        const promptsJson = JSON.stringify(incomingPrompts)
        const deletedJson = JSON.stringify(deletedIds)
        const settingsUpdatedAt = incomingSettings?.updatedAt ?? 0
        const settingsJson = JSON.stringify(incomingSettings?.data ?? {})
        const foldersUpdatedAt = hasFolderPush ? incomingFolders!.updatedAt : 0
        const foldersJson = hasFolderPush
            ? JSON.stringify(incomingFolders!.names)
            : currentFoldersJson
        const proKey = hasProPush ? body.proKey! : state.pro_key
        const deletedAt = Date.now()

        const statements: D1PreparedStatement[] = [
            env.DB.prepare(
                `UPDATE sync_state
                 SET rev = rev + 1,
                     settings_data = CASE WHEN ?2 > settings_updated_at THEN ?3 ELSE settings_data END,
                     settings_updated_at = MAX(settings_updated_at, ?2),
                     folders = CASE
                         WHEN ?4 > folders_updated_at AND (?11 = 0 OR protocol_version < 2)
                         THEN ?5 ELSE folders END,
                     folders_updated_at = CASE
                         WHEN ?4 > folders_updated_at AND (?11 = 0 OR protocol_version < 2)
                         THEN ?4 ELSE folders_updated_at END,
                     pro_key = CASE WHEN ?6 = 1 AND ?7 IS NOT pro_key THEN ?7 ELSE pro_key END,
                     protocol_version = MAX(protocol_version, ?10)
                 WHERE user_id = ?1 AND (
                     ?2 > settings_updated_at OR
                     (?4 > folders_updated_at AND (?11 = 0 OR protocol_version < 2)) OR
                     (?6 = 1 AND ?7 IS NOT pro_key) OR
                     ?10 > protocol_version OR
                     EXISTS (
                         SELECT 1 FROM json_each(?8) AS incoming
                         LEFT JOIN prompts AS stored
                           ON stored.user_id = ?1
                          AND stored.id = json_extract(incoming.value, '$.id')
                         WHERE stored.id IS NULL
                            OR CAST(json_extract(incoming.value, '$.updatedAt') AS INTEGER) >
                               CASE WHEN stored.deleted_at IS NULL
                                    THEN stored.updated_at ELSE stored.deleted_at END
                            OR (
                                stored.deleted_at IS NULL AND
                                CAST(json_extract(incoming.value, '$.updatedAt') AS INTEGER) = stored.updated_at AND (
                                    stored.title IS NOT json_extract(incoming.value, '$.title') OR
                                    stored.text IS NOT json_extract(incoming.value, '$.text') OR
                                    stored.description IS NOT json_extract(incoming.value, '$.description') OR
                                    stored.tags IS NOT json_extract(incoming.value, '$.tags') OR
                                    stored.folder IS NOT json_extract(incoming.value, '$.folder') OR
                                    stored.sort_index IS NOT json_extract(incoming.value, '$.sortIndex')
                                )
                            )
                     ) OR
                     EXISTS (
                         SELECT 1 FROM json_each(?9) AS removed
                         JOIN prompts AS stored
                           ON stored.user_id = ?1 AND stored.id = removed.value
                         WHERE stored.deleted_at IS NULL
                     )
                 )`,
            ).bind(
                userId,
                settingsUpdatedAt,
                settingsJson,
                foldersUpdatedAt,
                foldersJson,
                hasProPush ? 1 : 0,
                proKey,
                promptsJson,
                deletedJson,
                requestedProtocol,
                hasLegacyFolderPush ? 1 : 0,
            ),
        ]

        if (incomingPrompts.length > 0) {
            statements.push(
                env.DB.prepare(
                    `INSERT INTO prompts
                       (user_id, id, title, text, description, tags, folder, sort_index, rev, updated_at, deleted_at)
                     SELECT ?1,
                            json_extract(incoming.value, '$.id'),
                            json_extract(incoming.value, '$.title'),
                            json_extract(incoming.value, '$.text'),
                            json_extract(incoming.value, '$.description'),
                            json_extract(incoming.value, '$.tags'),
                            json_extract(incoming.value, '$.folder'),
                            json_extract(incoming.value, '$.sortIndex'),
                            (SELECT rev FROM sync_state WHERE user_id = ?1),
                            json_extract(incoming.value, '$.updatedAt'),
                            NULL
                     FROM json_each(?2) AS incoming
                     WHERE true
                     ON CONFLICT(user_id, id) DO UPDATE SET
                       title=excluded.title, text=excluded.text, description=excluded.description,
                       tags=excluded.tags, folder=excluded.folder, sort_index=excluded.sort_index,
                       rev=excluded.rev, updated_at=excluded.updated_at, deleted_at=NULL
                     WHERE excluded.updated_at >
                           CASE WHEN prompts.deleted_at IS NULL
                                THEN prompts.updated_at ELSE prompts.deleted_at END
                        OR (
                            prompts.deleted_at IS NULL AND
                            excluded.updated_at = prompts.updated_at AND (
                                prompts.title IS NOT excluded.title OR prompts.text IS NOT excluded.text OR
                                prompts.description IS NOT excluded.description OR prompts.tags IS NOT excluded.tags OR
                                prompts.folder IS NOT excluded.folder OR prompts.sort_index IS NOT excluded.sort_index
                            )
                        )`,
                ).bind(userId, promptsJson),
            )
        }

        if (deletedIds.length > 0) {
            statements.push(
                env.DB.prepare(
                    `UPDATE prompts
                     SET deleted_at = MAX(?3, updated_at + 1),
                         rev = (SELECT rev FROM sync_state WHERE user_id = ?1)
                     WHERE user_id = ?1 AND id IN (SELECT value FROM json_each(?2))
                       AND deleted_at IS NULL`,
                ).bind(userId, deletedJson, deletedAt),
            )
        }

        statements.push(
            env.DB.prepare(
                `SELECT * FROM prompts WHERE user_id = ?1 AND rev > ?2
                 UNION
                 SELECT * FROM prompts
                 WHERE user_id = ?1 AND id IN (
                     SELECT json_extract(value, '$.id') FROM json_each(?3)
                     UNION
                     SELECT value FROM json_each(?4)
                 )`,
            ).bind(userId, effectiveSinceRev, promptsJson, deletedJson),
            env.DB.prepare(
                `SELECT rev, protocol_version, folders, folders_updated_at,
                        settings_data, settings_updated_at, pro_key
                 FROM sync_state WHERE user_id = ?`,
            ).bind(userId),
        )

        const results = await env.DB.batch(statements)
        const changed = results[results.length - 2].results ?? []
        const nextState = results[results.length - 1].results?.[0] as SyncStateRow | undefined
        if (!nextState) throw new Error("sync state disappeared during mutation")
        return stateResponse(nextState, changed)
    }

    // The account changed on another device. Only now do we touch the prompt table.
    const changed = await env.DB.prepare("SELECT * FROM prompts WHERE user_id = ? AND rev > ?")
        .bind(userId, effectiveSinceRev)
        .all()
    return stateResponse(state, changed.results ?? [])
}
