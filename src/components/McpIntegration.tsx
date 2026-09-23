import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { isSignedIn } from "../auth/customAuth"
import { MCP_URL, mcpAccountRequest } from "../auth/mcp"
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
        setMessage((await cloudSyncNow()) ? t("MCP_SYNCED") : t("MCP_SYNC_FAILED"))
        setBusy(false)
    }
    async function disconnect() {
        setBusy(true)
        try {
            await mcpAccountRequest("disconnect")
            setMessage(t("MCP_DISCONNECTED"))
        } catch (error) {
            setMessage(error instanceof Error ? error.message : t("MCP_ERROR"))
        } finally {
            setBusy(false)
        }
    }
    return (
        <section className="mt-6 space-y-3">
            <h2 className="text-xl font-semibold">
                {t("MCP_TITLE")} <span className="badge badge-outline">Pro</span>
            </h2>
            <p>{t("MCP_DESCRIPTION")}</p>
            {!pro && (
                <a
                    className="link link-primary"
                    href="https://link.aipromptgenius.app/upgrade-pro"
                    target="_blank"
                    rel="noreferrer"
                >
                    {t("UPGRADE_TO_PRO")}
                </a>
            )}
            {!signedIn ? (
                <button
                    className="btn btn-outline"
                    onClick={() => window.dispatchEvent(new Event(OPEN_AUTH_EVENT))}
                >
                    {t("MCP_SIGN_IN")}
                </button>
            ) : (
                <>
                    <p>{t("MCP_SETUP")}</p>
                    <input
                        aria-label={t("MCP_ENDPOINT")}
                        className="input input-bordered w-full"
                        readOnly
                        value={MCP_URL}
                        onFocus={event => event.currentTarget.select()}
                    />
                    <div className="flex flex-wrap gap-2">
                        <button className="btn btn-outline" disabled={busy} onClick={sync}>
                            {t("MCP_SYNC")}
                        </button>
                        <button className="btn btn-outline" disabled={busy} onClick={disconnect}>
                            {t("MCP_DISCONNECT")}
                        </button>
                    </div>
                </>
            )}
            {message && <p role="status">{message}</p>}
        </section>
    )
}
