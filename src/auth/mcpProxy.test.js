import { describe, expect, it, vi } from "vitest"
import proxy from "../../public/_worker.js"

describe("custom-domain MCP proxy", () => {
    it("preserves the public URL, auth headers, and body for MCP and OAuth", async () => {
        for (const path of [
            "/mcp",
            "/oauth/authorize",
            "/oauth/token",
            "/oauth/register",
            "/.well-known/oauth-authorization-server",
            "/.well-known/oauth-protected-resource/mcp",
        ]) {
            const req = new Request(`https://lib.aipromptgenius.app${path}`, {
                method: "POST",
                headers: { authorization: "Bearer test" },
                body: "test",
            })
            const env = {
                MCP_BACKEND: {
                    fetch: vi.fn(async request => {
                        expect(request).toBe(req)
                        return new Response("backend")
                    }),
                },
                ASSETS: { fetch: vi.fn() },
            }
            expect(await (await proxy.fetch(req, env)).text()).toBe("backend")
            expect(env.ASSETS.fetch).not.toHaveBeenCalled()
        }
    })
    it("leaves app assets and WorkOS callbacks on Pages", async () => {
        const env = {
            MCP_BACKEND: { fetch: vi.fn() },
            ASSETS: { fetch: vi.fn(async () => new Response("app")) },
        }
        for (const path of ["/", "/callback", "/assets/app.js", "/mcp-other"])
            expect(
                await (
                    await proxy.fetch(new Request(`https://lib.aipromptgenius.app${path}`), env)
                ).text(),
            ).toBe("app")
        expect(env.MCP_BACKEND.fetch).not.toHaveBeenCalled()
    })
})
