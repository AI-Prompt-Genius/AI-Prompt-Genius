import type { EntitlementState } from "./entitlements"

export interface LibraryState extends EntitlementState {
    rev: number
    folders: string
    folders_updated_at: number
}
export interface PromptRow {
    id: string
    title: string
    text: string
    description: string
    tags: string
    folder: string
    sort_index: number
    rev: number
    updated_at: number
    deleted_at: number | null
}
export interface PromptInput {
    id: string
    title?: string
    text?: string
    description?: string
    tags?: string[]
    folder?: string | null
    sortIndex?: number
}
export class LibraryError extends Error {
    constructor(
        public code: string,
        message: string,
        public details?: unknown,
    ) {
        super(message)
    }
}
export const conflict = (revision: number) =>
    new LibraryError(
        "revision_conflict",
        "The library changed. Fetch it again before retrying with a new requestId.",
        { revision },
    )
export function folderNames(state: LibraryState): string[] {
    const names: unknown = JSON.parse(state.folders)
    if (!Array.isArray(names) || !names.every(n => typeof n === "string"))
        throw new Error("Invalid stored folders")
    return names
}
function unique(values: string[]): void {
    if (new Set(values).size !== values.length)
        throw new LibraryError("duplicate_items", "Each ID or folder name must appear only once.")
}
function prompt(row: PromptRow) {
    return {
        id: row.id,
        title: row.title ?? "",
        text: row.text ?? "",
        description: row.description ?? "",
        tags: row.tags ? row.tags.split(";").filter(Boolean) : [],
        folder: row.folder || null,
        sortIndex: row.sort_index,
        revision: row.rev,
        updatedAt: row.updated_at,
    }
}
async function hash(value: string): Promise<string> {
    return Array.from(
        new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))),
        b => b.toString(16).padStart(2, "0"),
    ).join("")
}
async function selected(db: D1Database, userId: string, ids: string[]): Promise<PromptRow[]> {
    unique(ids)
    return (
        await db
            .prepare(
                "SELECT * FROM prompts WHERE user_id = ? AND id IN (SELECT value FROM json_each(?))",
            )
            .bind(userId, JSON.stringify(ids))
            .all<PromptRow>()
    ).results
}
function requireAll(rows: PromptRow[], ids: string[]): void {
    const live = new Set(rows.filter(r => r.deleted_at === null).map(r => r.id))
    const missing = ids.filter(id => !live.has(id))
    if (missing.length)
        throw new LibraryError("not_found", "Some prompts do not exist in your library.", {
            ids: missing,
        })
}

export async function fetchPrompts(
    db: D1Database,
    userId: string,
    state: LibraryState,
    args: {
        ids?: string[]
        cursor?: string
        limit?: number
        folder?: string | null
    },
) {
    let after = ""
    if (args.cursor) {
        try {
            const cursor = JSON.parse(
                new TextDecoder().decode(Uint8Array.from(atob(args.cursor), c => c.charCodeAt(0))),
            ) as { id: string; rev: number; folder?: string | null }
            if (cursor.rev !== state.rev) throw conflict(state.rev)
            if (typeof cursor.id !== "string" || cursor.folder !== args.folder) throw new Error()
            after = cursor.id
        } catch (error) {
            if (error instanceof LibraryError) throw error
            throw new LibraryError(
                "invalid_cursor",
                "Use the cursor with the same folder filter, or start again without it.",
            )
        }
    }
    if (args.ids && args.cursor)
        throw new LibraryError("invalid_input", "Use IDs or a cursor, not both.")
    let rows: PromptRow[]
    const limit = args.limit ?? 50
    if (args.ids) {
        rows = await selected(db, userId, args.ids)
        requireAll(rows, args.ids)
    } else {
        const whereFolder = args.folder === undefined ? "" : " AND folder = ?4"
        const query = db.prepare(
            `SELECT * FROM prompts WHERE user_id = ?1 AND id > ?2 AND deleted_at IS NULL${whereFolder} ORDER BY id LIMIT ?3`,
        )
        rows = (
            await (args.folder === undefined
                ? query.bind(userId, after, limit + 1)
                : query.bind(userId, after, limit + 1, args.folder ?? "")
            ).all<PromptRow>()
        ).results
    }
    // Detect writes that raced pagination; never silently return an inconsistent page/cursor.
    const latest = await db
        .prepare("SELECT rev FROM sync_state WHERE user_id = ?")
        .bind(userId)
        .first<{ rev: number }>()
    if (latest?.rev !== state.rev) throw conflict(latest?.rev ?? 0)
    const output: ReturnType<typeof prompt>[] = []
    let bytes = 0
    for (const row of rows) {
        const item = prompt(row)
        const size = new TextEncoder().encode(JSON.stringify(item)).length
        if (!args.ids && output.length && (output.length >= limit || bytes + size > 512_000)) break
        output.push(item)
        bytes += size
    }
    const more = !args.ids && rows.length > output.length
    return {
        revision: state.rev,
        prompts: output,
        nextCursor: more
            ? btoa(
                  String.fromCharCode(
                      ...new TextEncoder().encode(
                          JSON.stringify({
                              id: output[output.length - 1].id,
                              rev: state.rev,
                              folder: args.folder,
                          }),
                      ),
                  ),
              )
            : null,
    }
}

interface MutationArgs {
    expectedRevision: number
    requestId: string
    [key: string]: unknown
}
interface Receipt {
    payload_hash: string
    result: string
}
type StatementFactory = (marker: string, revision: number) => D1PreparedStatement
const gate =
    "EXISTS (SELECT 1 FROM sync_state WHERE user_id = ?1 AND mcp_write_id = ?2 AND rev = ?3)"

/** All write statements share a CAS marker inside one D1 batch/transaction. */
export async function mutateLibrary(
    db: D1Database,
    userId: string,
    state: LibraryState,
    tool: string,
    args: MutationArgs,
) {
    const payloadHash = await hash(
        JSON.stringify({ tool, args }, (_, value) =>
            value && typeof value === "object" && !Array.isArray(value)
                ? Object.fromEntries(
                      Object.keys(value)
                          .sort()
                          .map(key => [key, value[key]]),
                  )
                : value,
        ),
    )
    const readReceipt = () =>
        db
            .prepare(
                "SELECT payload_hash, result FROM mcp_mutations WHERE user_id = ? AND request_id = ?",
            )
            .bind(userId, args.requestId)
            .first<Receipt>()
    const replay = (receipt: Receipt) => {
        if (receipt.payload_hash !== payloadHash)
            throw new LibraryError(
                "request_id_reused",
                "Use a new requestId for different arguments.",
            )
        return { ...JSON.parse(receipt.result), replayed: true }
    }
    const previous = await readReceipt()
    if (previous) return replay(previous)
    if (state.rev !== args.expectedRevision) throw conflict(state.rev)
    const now = Date.now()
    let folders = folderNames(state)
    const oldFolders = JSON.stringify(folders)
    const statements: StatementFactory[] = []
    let ids: string[] = []
    let affected = 0
    const assertFolder = (name: string | null | undefined) => {
        if (name && !folders.includes(name))
            throw new LibraryError("folder_not_found", "Create the destination folder first.", {
                folder: name,
            })
    }

    if (["create_prompts", "update_prompts", "reorder_prompts", "move_prompts"].includes(tool)) {
        let incoming: PromptInput[]
        if (tool === "reorder_prompts")
            incoming = args.positions as { id: string; sortIndex: number }[]
        else if (tool === "move_prompts")
            incoming = (args.ids as string[]).map(id => ({
                id,
                folder: args.folder as string | null,
            }))
        else incoming = args.prompts as PromptInput[]
        ids = incoming.map(p => p.id)
        const rows = await selected(db, userId, ids)
        if (tool === "create_prompts") {
            if (rows.length)
                throw new LibraryError(
                    "already_exists",
                    "Prompt IDs must be new, including deleted IDs.",
                    { ids: rows.map(r => r.id) },
                )
        } else requireAll(rows, ids)
        const byId = new Map(rows.map(row => [row.id, row]))
        const changes: PromptRow[] = []
        for (const item of incoming) {
            assertFolder(item.folder)
            const old = byId.get(item.id)
            const next = {
                id: item.id,
                title: item.title ?? old?.title ?? "",
                text: item.text ?? old?.text ?? "",
                description: item.description ?? old?.description ?? "",
                tags: item.tags ? item.tags.join(";") : old?.tags ?? "",
                folder: item.folder === undefined ? old?.folder ?? "" : item.folder ?? "",
                sort_index: item.sortIndex ?? old?.sort_index ?? 0,
                updated_at: Math.max(now, (old?.updated_at ?? 0) + 1),
                deleted_at: null,
                rev: state.rev + 1,
            }
            if (
                old &&
                ["title", "text", "description", "tags", "folder", "sort_index"].every(
                    key => old[key as keyof PromptRow] === next[key as keyof PromptRow],
                )
            )
                continue
            changes.push(next)
        }
        affected = changes.length
        if (changes.length)
            statements.push((marker, revision) =>
                db
                    .prepare(
                        `INSERT INTO prompts
            (user_id,id,title,text,description,tags,folder,sort_index,updated_at,deleted_at,rev)
            SELECT ?1,json_extract(value,'$.id'),json_extract(value,'$.title'),json_extract(value,'$.text'),
                json_extract(value,'$.description'),json_extract(value,'$.tags'),json_extract(value,'$.folder'),
                json_extract(value,'$.sort_index'),json_extract(value,'$.updated_at'),NULL,?3
            FROM json_each(?4) WHERE ${gate}
            ON CONFLICT(user_id,id) DO UPDATE SET title=excluded.title,text=excluded.text,description=excluded.description,
                tags=excluded.tags,folder=excluded.folder,sort_index=excluded.sort_index,updated_at=excluded.updated_at,rev=excluded.rev`,
                    )
                    .bind(userId, marker, revision, JSON.stringify(changes)),
            )
    } else if (tool === "delete_prompts") {
        ids = args.ids as string[]
        const rows = await selected(db, userId, ids)
        requireAll(rows, ids)
        affected = rows.length
        if (args.dryRun) return { revision: state.rev, dryRun: true, affected, ids }
        statements.push((marker, revision) =>
            db
                .prepare(
                    `UPDATE prompts SET deleted_at=MAX(?5,updated_at+1),rev=?3
            WHERE user_id=?1 AND id IN (SELECT value FROM json_each(?4)) AND deleted_at IS NULL AND ${gate}`,
                )
                .bind(userId, marker, revision, JSON.stringify(ids), now),
        )
    } else if (tool === "create_folders") {
        const names = args.names as string[]
        unique(names)
        const newNames = names.filter(name => !folders.includes(name))
        folders = [...folders, ...newNames]
        affected = newNames.length
        if (folders.length > 1000)
            throw new LibraryError("folder_limit", "A library supports up to 1,000 folders.")
    } else if (tool === "rename_folder") {
        const from = args.from as string,
            to = args.to as string
        if (!folders.includes(from))
            throw new LibraryError("folder_not_found", "The source folder does not exist.")
        if (from !== to) {
            if (folders.includes(to))
                throw new LibraryError(
                    "folder_exists",
                    "The destination folder already exists. Move prompts there explicitly to merge folders.",
                )
            folders = folders.map(name => (name === from ? to : name))
            affected = 1
            statements.push((marker, revision) =>
                db
                    .prepare(
                        `UPDATE prompts SET folder=?5,updated_at=MAX(?6,updated_at+1),rev=?3
                WHERE user_id=?1 AND folder=?4 AND deleted_at IS NULL AND ${gate}`,
                    )
                    .bind(userId, marker, revision, from, to, now),
            )
        }
    } else if (tool === "reorder_folders") {
        const names = args.names as string[]
        unique(names)
        if (names.length !== folders.length || names.some(n => !folders.includes(n)))
            throw new LibraryError(
                "invalid_folder_order",
                "Include every existing folder exactly once.",
            )
        folders = names
        affected = JSON.stringify(names) === oldFolders ? 0 : names.length
    } else if (tool === "delete_folders") {
        const names = args.names as string[]
        unique(names)
        if (names.some(n => !folders.includes(n)))
            throw new LibraryError("folder_not_found", "Some folders do not exist.")
        folders = folders.filter(n => !names.includes(n))
        affected = names.length
        const count = await db
            .prepare(
                "SELECT COUNT(*) AS count FROM prompts WHERE user_id=? AND folder IN (SELECT value FROM json_each(?)) AND deleted_at IS NULL",
            )
            .bind(userId, JSON.stringify(names))
            .first<{ count: number }>()
        if (args.dryRun)
            return {
                revision: state.rev,
                dryRun: true,
                folders: names,
                affectedPrompts: count?.count ?? 0,
                deleteContents: args.deleteContents ?? false,
            }
        const set = args.deleteContents
            ? "deleted_at=MAX(?5,updated_at+1)"
            : "folder='',updated_at=MAX(?5,updated_at+1)"
        statements.push((marker, revision) =>
            db
                .prepare(
                    `UPDATE prompts SET ${set},rev=?3
            WHERE user_id=?1 AND folder IN (SELECT value FROM json_each(?4)) AND deleted_at IS NULL AND ${gate}`,
                )
                .bind(userId, marker, revision, JSON.stringify(names), now),
        )
    } else throw new LibraryError("unknown_tool", "Unknown library operation.")

    if (!affected && JSON.stringify(folders) === oldFolders)
        return { revision: state.rev, affected: 0, ids }
    const marker = crypto.randomUUID(),
        revision = state.rev + 1
    const result = { revision, affected, ids, folders }
    const folderChanged = JSON.stringify(folders) !== oldFolders
    const batch = [
        db
            .prepare(
                `UPDATE sync_state SET rev=?3,mcp_write_id=?2,
        folders=?4,folders_updated_at=CASE WHEN ?5 THEN MAX(?6,folders_updated_at+1) ELSE folders_updated_at END,
        protocol_version=MAX(protocol_version,2)
        WHERE user_id=?1 AND rev=?7 AND NOT EXISTS (SELECT 1 FROM mcp_mutations WHERE user_id=?1 AND request_id=?8)`,
            )
            .bind(
                userId,
                marker,
                revision,
                JSON.stringify(folders),
                Number(folderChanged),
                now,
                state.rev,
                args.requestId,
            ),
        ...statements.map(make => make(marker, revision)),
        db
            .prepare(
                `INSERT INTO mcp_mutations(user_id,request_id,payload_hash,result,created_at)
            SELECT ?1,?4,?5,?6,?7 WHERE ${gate}`,
            )
            .bind(
                userId,
                marker,
                revision,
                args.requestId,
                payloadHash,
                JSON.stringify(result),
                now,
            ),
        db
            .prepare(`DELETE FROM mcp_mutations WHERE user_id=?1 AND created_at < ?4 AND ${gate}`)
            .bind(userId, marker, revision, now - 86400000),
        db
            .prepare(
                "SELECT payload_hash,result FROM mcp_mutations WHERE user_id=? AND request_id=?",
            )
            .bind(userId, args.requestId),
    ]
    const results = await db.batch(batch)
    const receipt = results[results.length - 1].results[0] as Receipt | undefined
    if (receipt) return { ...replay(receipt), replayed: results[0].meta.changes === 0 }
    throw conflict(
        (
            await db
                .prepare("SELECT rev FROM sync_state WHERE user_id=?")
                .bind(userId)
                .first<{ rev: number }>()
        )?.rev ?? 0,
    )
}
