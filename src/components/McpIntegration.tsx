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
    const [setup, setSetup] = useState(false)
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
        <main
            className="flex-1 min-w-0 h-full overflow-y-auto bg-base-100"
            aria-labelledby="mcp-page-title"
        >
            <header className="border-b border-base-300 px-6 py-5 font-semibold">
                {t(k.MCP_TITLE)}
            </header>
            <div className="max-w-5xl mx-auto px-6 py-10 space-y-8 pb-24">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 id="mcp-page-title" className="text-3xl font-bold mb-2">
                            {t(k.MCP_TITLE)}
                        </h1>
                        <p className="opacity-70">{t(k.MCP_PAGE_SUBTITLE)}</p>
                    </div>
                    <button
                        className="btn btn-primary"
                        aria-expanded={setup}
                        aria-controls="mcp-setup"
                        onClick={() => setSetup(!setup)}
                    >
                        {t(setup ? k.CLOSE : k.MCP_NEW_CONNECTION)}
                    </button>
                </div>
                <p className="max-w-2xl">{t(k.MCP_DESCRIPTION)}</p>
                <div className="grid sm:grid-cols-2 gap-4">
                    {[k.MCP_EXAMPLE_ORGANIZE, k.MCP_TEST_PROMPT].map(example => (
                        <div
                            key={example}
                            className="border border-base-300 rounded-2xl p-6 bg-base-200"
                        >
                            <p className="text-lg">{t(example)}</p>
                        </div>
                    ))}
                </div>
                {setup && (
                    <section
                        id="mcp-setup"
                        className="border border-base-300 rounded-2xl p-6 space-y-4"
                    >
                        <h2 className="text-xl font-semibold">{t(k.MCP_SETUP_HEADING)}</h2>
                        <p className="text-sm opacity-70">{t(k.MCP_SHORT_REQUIREMENTS)}</p>
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
                        <ol className="list-decimal ps-6 space-y-3">
                            <li>{t(k.MCP_SHORT_STEP_ONE)}</li>
                            <li>{t(k.MCP_SHORT_STEP_TWO)}</li>
                            <li>{t(k.MCP_SHORT_STEP_THREE)}</li>
                        </ol>
                        <label className="block" htmlFor="mcp-endpoint">
                            {t(k.MCP_ENDPOINT)}
                        </label>
                        <div className="flex flex-wrap gap-3">
                            <input
                                id="mcp-endpoint"
                                className="input input-bordered flex-1 min-w-0"
                                dir="ltr"
                                readOnly
                                value={MCP_URL}
                                onFocus={event => event.currentTarget.select()}
                            />
                            <button className="btn btn-outline" onClick={copyEndpoint}>
                                {t(k.MCP_COPY)}
                            </button>
                        </div>
                        <p className="text-sm opacity-70">{t(k.MCP_SHORT_OPENAI)}</p>
                        <a
                            className="link text-sm"
                            href="https://developers.openai.com/plugins/deploy/connect-chatgpt"
                            target="_blank"
                            rel="noreferrer"
                        >
                            {t(k.MCP_OPENAI_GUIDE)}
                        </a>
                    </section>
                )}
                <section className="space-y-3">
                    <h2 className="text-xl font-semibold">{t(k.MCP_ACCESS_TITLE)}</h2>
                    <p className="opacity-70">{t(k.MCP_SHORT_ACCESS)}</p>
                    <div className="flex flex-wrap gap-3">
                        {signedIn ? (
                            <>
                                <button className="btn btn-outline" disabled={busy} onClick={sync}>
                                    {t(k.MCP_SYNC)}
                                </button>
                                <button
                                    className="btn btn-outline"
                                    disabled={busy}
                                    onClick={disconnect}
                                >
                                    {t(k.MCP_DISCONNECT)}
                                </button>
                            </>
                        ) : (
                            <button
                                className="btn btn-outline"
                                onClick={() => window.dispatchEvent(new Event(OPEN_AUTH_EVENT))}
                            >
                                {t(k.MCP_SIGN_IN)}
                            </button>
                        )}
                    </div>
                </section>
                {message && <p role="status">{t(message)}</p>}
            </div>
        </main>
    )
}
