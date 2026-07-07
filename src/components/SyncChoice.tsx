import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import k from "../i18n/keys"
import Head2 from "./Head2"
import { isSignedIn, userEmail } from "../auth/customAuth"
import { OPEN_AUTH_EVENT } from "./AuthModal"

// Optional cloud vs. local-only choice (shown during onboarding). Signing in is optional; choosing
// local-only surfaces a data-loss warning. Choosing cloud starts the WorkOS AuthKit sign-in
// (hosted page — email/password, Google, passkeys, 2FA). Inside the sidebar iframe the redirect
// runs in the fullscreen tab; we watch the `storage` event to flip to the signed-in state. The
// preference persists to localStorage ("syncPreference") for Settings and future reminders.
type SyncPref = "cloud" | "local" | null

export default function SyncChoice() {
    const { t } = useTranslation()
    const [pref, setPref] = useState<SyncPref>(
        (localStorage.getItem("syncPreference") as SyncPref) ?? null,
    )
    const [signedIn, setSignedIn] = useState(isSignedIn())

    // Sign-in may complete in another context (fullscreen tab) — same origin, so the mirrored
    // auth flag arrives via the storage event.
    useEffect(() => {
        const update = () => setSignedIn(isSignedIn())
        window.addEventListener("storage", update)
        window.addEventListener("auth-changed", update)
        return () => {
            window.removeEventListener("storage", update)
            window.removeEventListener("auth-changed", update)
        }
    }, [])

    function chooseLocal() {
        localStorage.setItem("syncPreference", "local")
        setPref("local")
    }

    function chooseCloud() {
        localStorage.setItem("syncPreference", "cloud")
        setPref("cloud")
        if (!signedIn) {
            window.dispatchEvent(new Event(OPEN_AUTH_EVENT))
        }
    }

    return (
        <div>
            <Head2>{t(k.SYNC_CHOICE_TITLE)}</Head2>
            <p className="mb-3">{t(k.SYNC_CHOICE_SUBTITLE)}</p>

            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    id="choose-cloud"
                    onClick={chooseCloud}
                    className={`btn flex-1 h-auto py-3 normal-case ${
                        pref === "cloud" ? "btn-primary" : "btn-outline"
                    }`}
                >
                    <span className="flex flex-col items-start text-left">
                        <span className="font-bold">{t(k.SYNC_CHOICE_CLOUD_TITLE)}</span>
                        <span className="text-xs font-normal opacity-80">
                            {t(k.SYNC_CHOICE_CLOUD_DESC)}
                        </span>
                    </span>
                </button>
                <button
                    id="choose-local"
                    onClick={chooseLocal}
                    className={`btn flex-1 h-auto py-3 normal-case ${
                        pref === "local" ? "btn-primary" : "btn-outline"
                    }`}
                >
                    <span className="flex flex-col items-start text-left">
                        <span className="font-bold">{t(k.SYNC_CHOICE_LOCAL_TITLE)}</span>
                        <span className="text-xs font-normal opacity-80">
                            {t(k.SYNC_CHOICE_LOCAL_DESC)}
                        </span>
                    </span>
                </button>
            </div>

            {pref === "cloud" && signedIn && (
                <div className="alert alert-success mt-4 text-sm" id="sync-success">
                    <span>
                        <strong>{t(k.SYNC_CHOICE_CLOUD_ON)}</strong>{" "}
                        {t(k.SYNC_CHOICE_CLOUD_ON_DESC, { email: userEmail() })}{" "}
                        <em>{t(k.SYNC_CHOICE_SETTINGS_CLOUD)}</em>.
                    </span>
                </div>
            )}

            {pref === "cloud" && !signedIn && (
                <div className="alert alert-info mt-4 text-sm" id="sync-pending">
                    <span>{t(k.SYNC_CHOICE_PENDING)}</span>
                </div>
            )}

            {pref === "local" && (
                <div className="alert alert-warning mt-4 text-sm" id="local-warning">
                    <span>
                        <strong>{t(k.SYNC_CHOICE_LOCAL_WARNING_TITLE)}</strong>{" "}
                        {t(k.SYNC_CHOICE_LOCAL_WARNING_DESC)}{" "}
                        <em>{t(k.SYNC_CHOICE_SETTINGS_IMPORT)}</em>
                        {t(k.SYNC_CHOICE_LOCAL_WARNING_DESC2)}
                    </span>
                </div>
            )}
        </div>
    )
}
