import { useEffect, useState, useRef } from "react"
import { useTranslation } from "react-i18next"
import { isSignedIn } from "../auth/customAuth"
import k from "../i18n/keys"
import { MCP_URL, mcpAccountRequest, mcpErrorKey } from "../auth/mcp"
import { cloudSyncNow } from "../sync/syncClient"
import { useProStatus } from "./js/pro"
import { SparklesIcon } from "./icons/Icons"
import { OPEN_AUTH_EVENT } from "./AuthModal"

export default function McpIntegration() {
    const { t } = useTranslation()
    const pro = useProStatus()
    const dialog = useRef<HTMLDialogElement>(null)
    const setupBody = useRef<HTMLDivElement>(null)
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
    async function copyText(text: string, success: string) {
        try {
            await navigator.clipboard.writeText(text)
            setMessage(success)
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
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 id="mcp-page-title" className="text-3xl font-bold mb-2">
                            <span className="inline-flex items-center gap-2">
                                <SparklesIcon />
                                {t(k.MCP_TITLE)}
                            </span>
                        </h1>
                        <p className="opacity-70">{t(k.MCP_PAGE_SUBTITLE)}</p>
                    </div>
                    <button
                        className="btn btn-primary"
                        aria-haspopup="dialog"
                        aria-controls="mcp-setup"
                        onClick={() => {
                            setMessage("")
                            dialog.current?.showModal()
                            if (setupBody.current) setupBody.current.scrollTop = 0
                        }}
                    >
                        <SparklesIcon /> {t(k.MCP_NEW_CONNECTION)}
                    </button>
                </div>
                <p className="max-w-2xl">{t(k.MCP_DESCRIPTION)}</p>
                <div className="grid sm:grid-cols-2 gap-4">
                    {[k.MCP_EXAMPLE_ORGANIZE, k.MCP_TEST_PROMPT].map(example => (
                        <button
                            type="button"
                            onClick={() => copyText(t(example), k.MCP_EXAMPLE_COPIED)}
                            key={example}
                            className="border border-base-300 rounded-2xl p-5 bg-base-200 text-start hover:border-primary focus-visible:outline-primary"
                        >
                            <p className="text-lg">{t(example)}</p>
                            <span className="block text-sm text-primary mt-3">
                                {t(k.MCP_COPY_EXAMPLE)}
                            </span>
                        </button>
                    ))}
                </div>
                <dialog ref={dialog} className="modal p-3" aria-labelledby="mcp-setup-title">
                    <section id="mcp-setup" className="modal-box w-full max-w-xl p-0 flex flex-col">
                        <header className="flex items-center justify-between gap-3 border-b border-base-300 p-4 shrink-0">
                            <h2
                                id="mcp-setup-title"
                                className="font-semibold flex items-center gap-2"
                            >
                                <SparklesIcon />
                                {t(k.MCP_NEW_CONNECTION)}
                            </h2>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => dialog.current?.close()}
                            >
                                {t(k.CLOSE)}
                            </button>
                        </header>
                        <div ref={setupBody} className="overflow-y-auto p-4 space-y-3">
                            <h3 className="text-xl font-semibold">{t(k.MCP_SETUP_HEADING)}</h3>
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
                            <div className="flex flex-col gap-2">
                                <input
                                    id="mcp-endpoint"
                                    className="input input-bordered w-full shrink-0 min-w-0"
                                    dir="ltr"
                                    readOnly
                                    value={MCP_URL}
                                    onFocus={event => event.currentTarget.select()}
                                />
                                <button
                                    className="btn btn-outline"
                                    onClick={() => copyText(MCP_URL, k.MCP_COPIED)}
                                >
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
                            {message && (
                                <p role="status" className="text-sm">
                                    {t(message)}
                                </p>
                            )}
                        </div>
                        <footer className="border-t border-base-300 p-3 shrink-0">
                            <button
                                className="btn btn-primary w-full"
                                onClick={() => dialog.current?.close()}
                            >
                                {t(k.MCP_DONE)}
                            </button>
                        </footer>
                    </section>
                </dialog>
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
