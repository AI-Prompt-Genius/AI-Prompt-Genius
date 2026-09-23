import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { isSignedIn, userEmail, userId } from "../auth/customAuth"
import { mcpAccountRequest } from "../auth/mcp"
import { OPEN_AUTH_EVENT } from "./AuthModal"
import { useProStatus } from "./js/pro"
import { cloudSyncNow } from "../sync/syncClient"

interface Authorization {
    clientName: string
    redirectUri: string
    scopes: string[]
}
export default function McpConsent() {
    const { t } = useTranslation()
    const [authorizationUrl] = useState(() =>
        new URLSearchParams(window.location.search).get("mcp_authorize"),
    )
    const [accountId, setAccountId] = useState(() => (isSignedIn() ? userId() : null))
    const signedIn = !!accountId
    const [details, setDetails] = useState<Authorization | null>(null)
    const [scopes, setScopes] = useState<string[]>([])
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState("")
    const pro = useProStatus()
    useEffect(() => {
        const update = () => {
            setAccountId(isSignedIn() ? userId() : null)
        }
        window.addEventListener("auth-changed", update)
        window.addEventListener("storage", update)
        return () => {
            window.removeEventListener("auth-changed", update)
            window.removeEventListener("storage", update)
        }
    }, [])
    useEffect(() => {
        setDetails(null)
        setScopes([])
        setError("")
        if (!authorizationUrl || !accountId) return
        let active = true
        mcpAccountRequest<Authorization>("authorization", { authorizationUrl })
            .then(value => {
                if (active) {
                    setDetails(value)
                    setScopes(value.scopes)
                    setError("")
                }
            })
            .catch(reason => {
                if (active) setError(reason.message)
            })
        return () => {
            active = false
        }
    }, [authorizationUrl, accountId])
    if (!authorizationUrl) return null
    async function decide(approve: boolean) {
        setBusy(true)
        setError("")
        try {
            const result = await mcpAccountRequest<{ redirectTo: string }>("approve", {
                authorizationUrl,
                approve,
                scopes,
            })
            window.location.assign(result.redirectTo)
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : t("MCP_ERROR"))
            setBusy(false)
        }
    }
    return (
        <div
            className="modal modal-open"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mcp-consent-title"
        >
            <div className="modal-box space-y-4">
                <h2 className="text-xl font-semibold" id="mcp-consent-title">
                    {t("MCP_CONNECT")}
                </h2>
                {!signedIn ? (
                    <>
                        <p>{t("MCP_SIGN_IN_HELP")}</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => window.dispatchEvent(new Event(OPEN_AUTH_EVENT))}
                        >
                            {t("MCP_SIGN_IN")}
                        </button>
                    </>
                ) : (
                    <>
                        <p>{userEmail()}</p>
                        {details && (
                            <>
                                <p>
                                    <strong>{details.clientName}</strong> {t("MCP_REQUESTS_ACCESS")}
                                </p>
                                <p className="text-sm break-all">
                                    {t("MCP_RETURN_TO")}: {details.redirectUri}
                                </p>
                                {details.scopes.map(scope => (
                                    <label key={scope} className="flex gap-3 items-center">
                                        <input
                                            type="checkbox"
                                            className="checkbox"
                                            checked={scopes.includes(scope)}
                                            onChange={event =>
                                                setScopes(current =>
                                                    event.target.checked
                                                        ? [...current, scope]
                                                        : current.filter(s => s !== scope),
                                                )
                                            }
                                        />
                                        {t(
                                            scope === "library:read"
                                                ? "MCP_READ"
                                                : scope === "library:write"
                                                ? "MCP_WRITE"
                                                : "MCP_DELETE",
                                        )}
                                    </label>
                                ))}
                                <p>{t("MCP_CONSENT_NOTE")}</p>
                                {!pro && (
                                    <p>
                                        {t("MCP_PRO_REQUIRED")}{" "}
                                        <a
                                            className="link"
                                            href="https://link.aipromptgenius.app/upgrade-pro"
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {t("UPGRADE_TO_PRO")}
                                        </a>
                                    </p>
                                )}
                                <button
                                    className="btn btn-outline"
                                    disabled={busy}
                                    onClick={async () => {
                                        setBusy(true)
                                        const ok = await cloudSyncNow()
                                        if (!ok) setError(t("MCP_SYNC_FAILED"))
                                        setBusy(false)
                                    }}
                                >
                                    {t("MCP_SYNC")}
                                </button>
                                <div className="modal-action">
                                    <button
                                        className="btn"
                                        disabled={busy}
                                        onClick={() => decide(false)}
                                    >
                                        {t("MCP_DENY")}
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        disabled={busy || !pro || !scopes.length}
                                        onClick={() => decide(true)}
                                    >
                                        {t("MCP_ALLOW")}
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                )}
                {error && (
                    <p role="alert" className="text-error">
                        {error}
                    </p>
                )}
            </div>
        </div>
    )
}
