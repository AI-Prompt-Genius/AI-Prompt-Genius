import { getAccessToken, WORKER_URL } from "./customAuth"

export const MCP_URL = `${WORKER_URL}/mcp`
export async function mcpAccountRequest<T>(path: string, body: unknown = {}): Promise<T> {
    let token = await getAccessToken()
    if (!token) throw new Error("Please sign in to your AI Prompt Genius account.")
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
        if (data.error === "pro_required") throw new Error("An active Pro membership is required.")
        if (data.error === "mcp_not_configured")
            throw new Error("The MCP service is not available yet.")
        throw new Error(data.message ?? "Unable to complete the request. Please try again.")
    }
    return data as T
}
