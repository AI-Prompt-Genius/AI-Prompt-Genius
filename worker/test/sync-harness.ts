import { handleSync } from "../src/sync"

export default {
    fetch(request: Request, env: { DB: D1Database }): Promise<Response> {
        return handleSync(request, env, "test-user")
    },
} satisfies ExportedHandler<{ DB: D1Database }>
