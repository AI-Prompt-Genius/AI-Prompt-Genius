export { McpUsage } from "../src/mcpUsage"
import worker, { type Env } from "../src/index"

export default {
    fetch(request: Request, env: Env, ctx: ExecutionContext) {
        // Miniflare's dispatch proxy rewrites Host to its loopback listener. Restore the
        // externally requested host for the production SDK's DNS-rebinding checks.
        const headers = new Headers(request.headers)
        headers.set("host", new URL(request.url).host)
        return worker.fetch(new Request(request, { headers }), env, ctx)
    },
} satisfies ExportedHandler<Env>
