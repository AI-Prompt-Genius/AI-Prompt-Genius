// Keep MCP's public origin on the library custom domain. A service binding preserves
// the original URL for OAuth issuer/resource validation without exposing a proxy secret.
export default {
    fetch(request, env) {
        const path = new URL(request.url).pathname
        if (
            path === "/mcp" ||
            path.startsWith("/oauth/") ||
            path === "/.well-known/oauth-authorization-server" ||
            path === "/.well-known/oauth-protected-resource" ||
            path === "/.well-known/oauth-protected-resource/mcp"
        ) {
            return env.MCP_BACKEND.fetch(request)
        }
        return env.ASSETS.fetch(request)
    },
}
