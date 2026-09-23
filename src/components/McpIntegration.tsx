import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { isSignedIn } from "../auth/customAuth"
import k from "../i18n/keys"
import { MCP_URL, mcpAccountRequest, mcpErrorKey } from "../auth/mcp"
import { cloudSyncNow } from "../sync/syncClient"
import { useProStatus } from "./js/pro"
import { OPEN_AUTH_EVENT } from "./AuthModal"

export default function McpIntegration() {
    const { t } = useTranslation()
    const pro = useProStatus()
    const [signedIn, setSignedIn] = useState(isSignedIn())
    const [message, setMessage] = useState("")
    const [busy, setBusy] = useState(false)
    useEffect(() => {
        const update = () => setSignedIn(isSignedIn())
        window.addEventListener("auth-changed", update)
        window.addEventListener("storage", update)
        return () => {
            window.removeEventListener("auth-changed", update)
            window.removeEventListener("storage", update)
        }
    }, [])
    async function sync() {
        setBusy(true)
        try {
            setMessage((await cloudSyncNow()) ? k.MCP_SYNCED : k.MCP_SYNC_FAILED)
        } catch {
            setMessage(k.MCP_SYNC_FAILED)
        } finally {
            setBusy(false)
        }
    }
    async function disconnect() {
        setBusy(true)
        try {
            await mcpAccountRequest("disconnect")
            setMessage(k.MCP_DISCONNECTED)
        } catch (error) {
            setMessage(mcpErrorKey(error))
        } finally {
            setBusy(false)
        }
    }
    async function copyEndpoint() {
        try {
            await navigator.clipboard.writeText(MCP_URL)
            setMessage(k.MCP_COPIED)
        } catch {
            setMessage(k.MCP_COPY_FAILED)
        }
    }
    return (
        <section className="space-y-4">
            <p>{t(k.MCP_DESCRIPTION)}</p>
            <p>{t(k.MCP_PRO_HELP)}</p>
            {!pro && (
                <a
                    className="link link-primary"
                    href="https://link.aipromptgenius.app/upgrade-pro"
                    target="_blank"
                    rel="noreferrer"
                >
                    {t(k.UPGRADE_TO_PRO)}
                </a>
            )}
            <ol className="list-decimal ps-6 space-y-4">
                <li>
                    <h3 className="font-semibold">{t(k.MCP_STEP_SYNC_TITLE)}</h3>
                    <p>{t(k.MCP_STEP_SYNC_BODY)}</p>
                    {!signedIn ? (
                        <button
                            className="btn btn-outline mt-2"
                            onClick={() => window.dispatchEvent(new Event(OPEN_AUTH_EVENT))}
                        >
                            {t(k.MCP_SIGN_IN)}
                        </button>
                    ) : (
                        <button className="btn btn-outline mt-2" disabled={busy} onClick={sync}>
                            {t(k.MCP_SYNC)}
                        </button>
                    )}
                </li>
                <li>
                    <h3 className="font-semibold">{t(k.MCP_STEP_CONNECT_TITLE)}</h3>
                    <p>{t(k.MCP_STEP_CONNECT_BODY)}</p>
                    <label className="block mt-2" htmlFor="mcp-endpoint">
                        {t(k.MCP_ENDPOINT)}
                    </label>
                    <input
                        id="mcp-endpoint"
                        className="input input-bordered w-full"
                        dir="ltr"
                        readOnly
                        value={MCP_URL}
                        onFocus={event => event.currentTarget.select()}
                    />
                    <button className="btn btn-outline mt-2" onClick={copyEndpoint}>
                        {t(k.MCP_COPY)}
                    </button>
                    <p className="text-sm mt-2">{t(k.MCP_OPENAI_PENDING)}</p>
                    <a
                        className="link text-sm"
                        href="https://developers.openai.com/plugins/deploy/connect-chatgpt"
                        target="_blank"
                        rel="noreferrer"
                    >
                        {t(k.MCP_OPENAI_GUIDE)}
                    </a>
                </li>
                <li>
                    <h3 className="font-semibold">{t(k.MCP_STEP_APPROVE_TITLE)}</h3>
                    <p>{t(k.MCP_STEP_APPROVE_BODY)}</p>
                </li>
                <li>
                    <h3 className="font-semibold">{t(k.MCP_STEP_TEST_TITLE)}</h3>
                    <p>{t(k.MCP_STEP_TEST_BODY)}</p>
                    <blockquote className="border-s-2 ps-3 my-2">{t(k.MCP_TEST_PROMPT)}</blockquote>
                    <p>{t(k.MCP_SYNC_HELP)}</p>
                </li>
            </ol>
            {signedIn && (
                <div className="border-t pt-4 space-y-2">
                    <h3 className="font-semibold">{t(k.MCP_ACCESS_TITLE)}</h3>
                    <p>{t(k.MCP_ACCESS_HELP)}</p>
                    <button className="btn btn-outline" disabled={busy} onClick={disconnect}>
                        {t(k.MCP_DISCONNECT)}
                    </button>
                </div>
            )}
            {message && <p role="status">{t(message)}</p>}
        </section>
    )
}
