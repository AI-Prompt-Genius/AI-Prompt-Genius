import { McpUsage } from "../src/mcpUsage"

// Test-only clock control, never exported from the production Worker.
export class TestMcpUsage extends McpUsage {
    private testNow = 0
    protected now() {
        return this.testNow
    }
    async fetch(request: Request) {
        this.testNow = Number(request.headers.get("test-now"))
        if (new URL(request.url).pathname === "/seed") {
            await this.ctx.storage.put("usage", await request.json())
            return Response.json({ ok: true })
        }
        return Response.json(await this.consume())
    }
}
export default {
    fetch(request: Request, env: { USAGE: DurableObjectNamespace }) {
        return env.USAGE.getByName(request.headers.get("account") ?? "a").fetch(request)
    },
}
