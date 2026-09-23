import { handleSync } from "../src/sync"
import {
    resolveEntitlement,
    requirePro,
    setStripeEntitlement,
    type EntitlementState,
} from "../src/entitlements"
import { deleteUserAccount } from "../src/user"
import worker from "../src/index"

export default {
    async fetch(request: Request, env: { DB: D1Database }): Promise<Response> {
        const metrics = { queries: 0, rowsRead: 0, rowsWritten: 0 }
        const record = (result: D1Response) => {
            metrics.queries++
            metrics.rowsRead += result.meta.rows_read
            metrics.rowsWritten += result.meta.rows_written
        }
        function wrap(statement: D1PreparedStatement): D1PreparedStatement {
            return new Proxy(statement, {
                get(target, property) {
                    if (property === "bind")
                        return (...args: unknown[]) => wrap(target.bind(...args))
                    if (property === "first")
                        return async () => {
                            const result = await target.all()
                            record(result)
                            return result.results[0] ?? null
                        }
                    if (property === "run" || property === "all")
                        return async () => {
                            const result = await target[property]()
                            record(result)
                            return result
                        }
                    return Reflect.get(target, property, target)
                },
            })
        }
        const db = new Proxy(env.DB, {
            get(target, property) {
                if (property === "prepare") return (sql: string) => wrap(target.prepare(sql))
                if (property === "batch")
                    return async (statements: D1PreparedStatement[]) => {
                        const results = await target.batch(statements)
                        results.forEach(record)
                        return results
                    }
                return Reflect.get(target, property, target)
            },
        })
        const path = new URL(request.url).pathname
        const userId = request.headers.get("x-test-user") ?? "test-user"
        let response: Response
        if (path === "/sync") response = await handleSync(request, { DB: db }, userId)
        else if (path === "/check")
            response = (await requirePro(db, userId)) ?? Response.json({ allowed: true })
        else if (path === "/status") {
            const state = await db
                .prepare("SELECT * FROM sync_state WHERE user_id = ?")
                .bind(userId)
                .first<EntitlementState>()
            response = Response.json(state ? await resolveEntitlement(db, userId, state) : null)
        } else if (path === "/stripe") {
            const body = (await request.json()) as { until: number; version: number }
            response = Response.json(
                await setStripeEntitlement(db, userId, body.until, body.version),
            )
        } else if (path === "/delete") {
            await deleteUserAccount({ DB: db }, userId)
            response = Response.json({ deleted: true })
        } else response = await worker.fetch(request, { DB: db, WORKOS_CLIENT_ID: "test" })
        const result = new Response(response.body, response)
        result.headers.set("x-test-db", JSON.stringify(metrics))
        return result
    },
} satisfies ExportedHandler<{ DB: D1Database }>
