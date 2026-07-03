import { useEffect, useState } from "react"
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
            <Head2>How do you want to store your prompts?</Head2>
            <p className="mb-3">
                Signing in is optional. Sync keeps your library backed up and available on every
                device; local-only keeps everything in this browser.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    id="choose-cloud"
                    onClick={chooseCloud}
                    className={`btn flex-1 h-auto py-3 normal-case ${
                        pref === "cloud" ? "btn-primary" : "btn-outline"
                    }`}
                >
                    <span className="flex flex-col items-start text-left">
                        <span className="font-bold">Sync across devices</span>
                        <span className="text-xs font-normal opacity-80">
                            Sign in · backed up · everywhere
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
                        <span className="font-bold">Stay local only</span>
                        <span className="text-xs font-normal opacity-80">
                            No sign-in · this device only
                        </span>
                    </span>
                </button>
            </div>

            {pref === "cloud" && signedIn && (
                <div className="alert alert-success mt-4 text-sm" id="sync-success">
                    <span>
                        <strong>Cloud Sync is on.</strong> Signed in as {userEmail()} — your prompts
                        now sync automatically. Manage this anytime in{" "}
                        <em>Settings → Cloud Syncing</em>.
                    </span>
                </div>
            )}

            {pref === "cloud" && !signedIn && (
                <div className="alert alert-info mt-4 text-sm" id="sync-pending">
                    <span>
                        Finish signing in — you can use email &amp; password or Google. This screen
                        updates automatically.
                    </span>
                </div>
            )}

            {pref === "local" && (
                <div className="alert alert-warning mt-4 text-sm" id="local-warning">
                    <span>
                        <strong>Heads up — local-only.</strong> Your prompts live only in this
                        browser on this device. Clearing browsing data or switching devices will
                        lose them. Export a backup anytime from <em>Settings → Import/Export</em>,
                        and you can turn on Cloud Sync later.
                    </span>
                </div>
            )}
        </div>
    )
}
