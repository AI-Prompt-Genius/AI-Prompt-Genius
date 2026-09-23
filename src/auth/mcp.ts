import k from "../i18n/keys"
import { getAccessToken, WORKER_URL } from "./customAuth"

class McpAccountError extends Error {
    constructor(public translationKey: string) {
        super(translationKey)
    }
}
export function mcpErrorKey(error: unknown): string {
    return error instanceof McpAccountError ? error.translationKey : k.MCP_ERROR
}
export const MCP_URL = `${WORKER_URL}/mcp`
export async function mcpAccountRequest<T>(path: string, body: unknown = {}): Promise<T> {
    let token = await getAccessToken()
    if (!token) throw new McpAccountError(k.MCP_SIGN_IN_HELP)
    const request = () =>
        fetch(`${WORKER_URL}/integrations/mcp/${path}`, {
            method: "POST",
            headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
        })
    let response = await request()
    if (response.status === 401) {
        token = await getAccessToken(true)
        if (token) response = await request()
    }
    const data = await response.json()
    if (!response.ok) {
        if (data.error === "pro_required") throw new McpAccountError(k.MCP_PRO_REQUIRED)
        if (data.error === "mcp_not_configured") throw new McpAccountError(k.MCP_UNAVAILABLE)
        throw new McpAccountError(k.MCP_ERROR)
    }
    return data as T
}
