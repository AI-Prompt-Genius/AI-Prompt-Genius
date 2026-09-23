import {
    OAuthProvider,
    type OAuthHelpers,
    AuthorizationError,
} from "@cloudflare/workers-oauth-provider"
import { appOrigin, boundedJson, handleMcp, MCP_SCOPES, mcpUrl, type McpProps } from "./mcp"
import { requirePro } from "./entitlements"
import { proJson } from "./license"
import type { Env } from "./index"

export interface OAuthEnv {
    OAUTH_KV?: CloudflareBindings["OAUTH_KV"]
    OAUTH_PROVIDER?: OAuthHelpers
    MCP_PUBLIC_URL?: string
    APP_ORIGIN?: string
}

export function oauthProvider(env: Env, defaultHandler: ExportedHandler<Env>) {
    return new OAuthProvider<Env>({
        apiRoute: "/mcp",
        apiHandler: {
            async fetch(request, bindings, ctx) {
                return handleMcp(request, bindings, ctx.props as McpProps)
            },
        },
        defaultHandler,
        authorizeEndpoint: "/oauth/authorize",
        tokenEndpoint: "/oauth/token",
        clientRegistrationEndpoint: "/oauth/register",
        clientIdMetadataDocumentEnabled: true,
        accessTokenTTL: 900,
        refreshTokenTTL: 30 * 86400,
        allowImplicitFlow: false,
        allowPlainPKCE: false,
        scopesSupported: MCP_SCOPES,
        resourceMetadata: {
            resource: mcpUrl(env),
            authorization_servers: [new URL(mcpUrl(env)).origin],
            scopes_supported: MCP_SCOPES,
            resource_name: "AI Prompt Genius",
        },
        // Bind effective token scopes, including downscoped refreshes, to the verified context.
        tokenExchangeCallback: options => ({
            accessTokenProps: {
                userId: options.userId,
                scopes: options.requestedScope,
                epoch: options.props.epoch,
            },
        }),
    })
}

async function parseAuthorization(env: Env, authorizationUrl: string) {
    const url = new URL(authorizationUrl),
        expected = new URL(mcpUrl(env))
    if (url.origin !== expected.origin || url.pathname !== "/oauth/authorize" || url.hash)
        throw new Error("Invalid authorization URL")
    const request = await env.OAUTH_PROVIDER!.parseAuthRequest(new Request(url))
    if (!request.codeChallenge || request.codeChallengeMethod !== "S256")
        throw new Error("PKCE S256 is required")
    if (request.scope.some(scope => !MCP_SCOPES.includes(scope)))
        throw new Error("Unsupported scope")
    // Clients omitting scope start read-only. The consent screen shows the exact grant.
    if (!request.scope.length) request.scope = ["library:read"]
    const client = await env.OAUTH_PROVIDER!.lookupClient(request.clientId)
    if (!client) throw new Error("Unknown client")
    return { request, client }
}

export async function handleMcpAuthorization(
    req: Request,
    env: Env,
    userId: string | null,
): Promise<Response> {
    const path = new URL(req.url).pathname
    if (!env.OAUTH_PROVIDER) return proJson({ error: "mcp_not_configured" }, 503)
    try {
        if (path === "/oauth/authorize" && req.method === "GET") {
            await parseAuthorization(env, req.url)
            const destination = new URL(appOrigin(env))
            destination.searchParams.set("mcp_authorize", req.url)
            return new Response(null, {
                status: 302,
                headers: {
                    location: destination.toString(),
                    "cache-control": "no-store",
                    "referrer-policy": "no-referrer",
                },
            })
        }
        if (!userId) return proJson({ error: "unauthorized" }, 401)
        if (
            req.method !== "POST" ||
            !req.headers.get("content-type")?.startsWith("application/json")
        )
            return proJson({ error: "invalid_request" }, 400)
        if (req.headers.has("origin") && req.headers.get("origin") !== appOrigin(env))
            return proJson({ error: "invalid_origin" }, 403)
        const body = (await boundedJson(req, 16384)) as {
            authorizationUrl?: unknown
            approve?: unknown
            scopes?: unknown
        }
        if (path === "/integrations/mcp/connections") {
            return proJson(await env.OAUTH_PROVIDER.listUserGrants(userId, { limit: 100 }))
        }
        if (path === "/integrations/mcp/disconnect") {
            // One account-row write revokes every token immediately, regardless of KV propagation.
            await env.DB.prepare(
                "UPDATE sync_state SET mcp_auth_epoch=mcp_auth_epoch+1 WHERE user_id=?",
            )
                .bind(userId)
                .run()
            return proJson({ disconnected: true })
        }
        if (typeof body.authorizationUrl !== "string" || body.authorizationUrl.length > 8192)
            return proJson({ error: "invalid_request" }, 400)
        const { request, client } = await parseAuthorization(env, body.authorizationUrl)
        if (path === "/integrations/mcp/authorization")
            return proJson({
                clientName: client.clientName ?? "MCP client",
                redirectUri: request.redirectUri,
                scopes: request.scope,
            })
        if (path !== "/integrations/mcp/approve" || typeof body.approve !== "boolean")
            return proJson({ error: "invalid_request" }, 400)
        if (!body.approve) {
            const redirect = new URL(request.redirectUri)
            redirect.searchParams.set("error", "access_denied")
            if (request.state) redirect.searchParams.set("state", request.state)
            if (request.issuer) redirect.searchParams.set("iss", request.issuer)
            return proJson({ redirectTo: redirect.toString() })
        }
        const denied = await requirePro(env.DB, userId)
        if (denied) return denied
        const scopes = body.scopes
        if (
            !Array.isArray(scopes) ||
            !scopes.length ||
            scopes.some(scope => typeof scope !== "string" || !request.scope.includes(scope))
        )
            return proJson({ error: "invalid_scope" }, 400)
        const state = await env.DB.prepare("SELECT mcp_auth_epoch FROM sync_state WHERE user_id=?")
            .bind(userId)
            .first<{ mcp_auth_epoch: number }>()
        if (!state) return proJson({ error: "sync_required" }, 409)
        return proJson(
            await env.OAUTH_PROVIDER.completeAuthorization({
                request,
                userId,
                scope: scopes,
                metadata: { clientName: client.clientName ?? "MCP client" },
                props: { userId, scopes, epoch: state.mcp_auth_epoch },
            }),
        )
    } catch (error) {
        return proJson(
            {
                error: "invalid_authorization_request",
                message:
                    error instanceof AuthorizationError
                        ? error.description
                        : "Restart connection setup from your MCP client.",
            },
            400,
        )
    }
}
