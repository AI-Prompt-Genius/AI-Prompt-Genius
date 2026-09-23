import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import k from "../i18n/keys"
import { OPEN_AUTH_EVENT } from "./AuthModal"
import McpIntegration from "./McpIntegration"

export default function McpModal({ onClose }: { onClose: () => void }) {
    const { t } = useTranslation()
    const dialog = useRef<HTMLDialogElement>(null)
    useEffect(() => {
        dialog.current?.showModal()
        const closeForSignIn = () => dialog.current?.close()
        window.addEventListener(OPEN_AUTH_EVENT, closeForSignIn)
        return () => window.removeEventListener(OPEN_AUTH_EVENT, closeForSignIn)
    }, [])
    return (
        <dialog ref={dialog} className="modal" aria-labelledby="mcp-title" onClose={onClose}>
            <div className="modal-box max-w-2xl">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <h2 id="mcp-title" className="text-xl font-semibold">
                        {t(k.MCP_TITLE)}
                    </h2>
                    <button className="btn btn-sm" onClick={onClose}>
                        {t(k.CLOSE)}
                    </button>
                </div>
                <McpIntegration />
            </div>
        </dialog>
    )
}
