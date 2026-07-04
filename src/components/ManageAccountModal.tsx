import { useEffect, useState } from "react"
import Head2 from "./Head2"
import { mfaChallenge, mfaEnroll, mfaVerifyEnroll, userEmail } from "../auth/customAuth"
import { cloudSyncNow } from "../sync/syncClient"

// Account management: shows the signed-in identity, manual sync, and TOTP 2FA enrollment
// (WorkOS returns the QR as a data URI — scan with any authenticator app; it's enforced at the
// next sign-in). Opened via: window.dispatchEvent(new Event("open-account-modal")).

export const OPEN_ACCOUNT_EVENT = "open-account-modal"

export default function ManageAccountModal() {
    const [open, setOpen] = useState(false)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState("")
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [secret, setSecret] = useState<string | null>(null)
    const [factorId, setFactorId] = useState<string | null>(null)
    const [code, setCode] = useState("")
    const [activated, setActivated] = useState(false)
    const [syncMsg, setSyncMsg] = useState("")

    useEffect(() => {
        const openHandler = () => {
            setOpen(true)
            setError("")
            setSyncMsg("")
        }
        window.addEventListener(OPEN_ACCOUNT_EVENT, openHandler)
        return () => window.removeEventListener(OPEN_ACCOUNT_EVENT, openHandler)
    }, [])

    if (!open) return null

    async function enroll2fa() {
        if (busy) return
        setBusy(true)
        setError("")
        const step = await mfaEnroll()
        setBusy(false)
        if (step.status === "ok" && step.qrCode) {
            setQrCode(step.qrCode)
            setSecret(step.secret ?? null)
            setFactorId(step.factorId ?? null)
        } else {
            setError(step.message ?? "Couldn't start 2FA enrollment.")
        }
    }

    // Confirm the authenticator works before 2FA is treated as active: challenge the new factor,
    // then verify the 6-digit code the user typed.
    async function confirm2fa() {
        if (busy || code.trim().length < 6 || !factorId) return
        setBusy(true)
        setError("")
        const ch = await mfaChallenge(factorId)
        if (ch.status !== "ok" || !ch.authenticationChallengeId) {
            setBusy(false)
            setError(ch.message ?? "Couldn't verify the code — try again.")
            return
        }
        const res = await mfaVerifyEnroll(ch.authenticationChallengeId, code.trim())
        setBusy(false)
        if (res.status === "ok") {
            setActivated(true)
            setError("")
        } else {
            setError(res.message ?? "That code didn't match. Try again.")
        }
    }

    async function syncNow() {
        if (busy) return
        setBusy(true)
        const ok = await cloudSyncNow()
        setBusy(false)
        setSyncMsg(ok ? "Synced ✓" : "Sync failed — try again")
    }

    return (
        <>
            <input
                defaultChecked
                type="checkbox"
                id="account-modal"
                className="modal-toggle hidden"
            />
            <div className="modal">
                <div className="modal-box max-w-md" id="account-modal-box">
                    <Head2>Your account</Head2>
                    <p className="mb-3">
                        Signed in as <strong id="account-modal-email">{userEmail()}</strong> — your
                        prompts sync automatically across devices.
                    </p>

                    <div className="flex gap-2 mb-4">
                        <button
                            id="account-modal-sync"
                            className="btn btn-sm"
                            disabled={busy}
                            onClick={syncNow}
                        >
                            {busy ? "Working…" : "Sync now"}
                        </button>
                        {syncMsg && <span className="self-center text-sm">{syncMsg}</span>}
                    </div>

                    <div className="divider text-xs">Two-factor authentication</div>
                    {!qrCode ? (
                        <>
                            <p className="text-sm mb-3">
                                Add an authenticator app (Google Authenticator, 1Password, etc.) as
                                a second factor. You&apos;ll be asked for a 6-digit code at sign-in.
                            </p>
                            <button
                                id="account-enroll-2fa"
                                className="btn btn-outline btn-sm"
                                disabled={busy}
                                onClick={enroll2fa}
                            >
                                Set up 2FA
                            </button>
                        </>
                    ) : activated ? (
                        <div className="alert alert-success text-sm" id="account-2fa-done">
                            <span>
                                Two-factor authentication is on. You&apos;ll be asked for a code
                                from your authenticator app at your next sign-in.
                            </span>
                        </div>
                    ) : (
                        <div className="text-sm">
                            <p className="mb-2">
                                Scan this QR code with your authenticator app, then enter the
                                6-digit code it shows to confirm and turn on 2FA.
                            </p>
                            <img
                                id="account-2fa-qr"
                                src={qrCode}
                                alt="2FA QR code"
                                className="w-40 h-40 mx-auto my-2"
                            />
                            {secret && (
                                <p className="text-xs opacity-70 break-all mb-3">
                                    Manual entry key: {secret}
                                </p>
                            )}
                            <input
                                id="account-2fa-code"
                                inputMode="numeric"
                                className="input input-bordered w-full mb-3 tracking-widest text-center"
                                placeholder="123456"
                                value={code}
                                maxLength={6}
                                onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                                onKeyDown={e => {
                                    if (e.key === "Enter") confirm2fa()
                                }}
                            />
                            <button
                                id="account-2fa-confirm"
                                className="btn btn-primary btn-sm w-full"
                                disabled={busy || code.length < 6}
                                onClick={confirm2fa}
                            >
                                {busy ? "Verifying…" : "Confirm & turn on 2FA"}
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="alert alert-error mt-3 text-sm">
                            <span>{error}</span>
                        </div>
                    )}
                </div>
                <div className="modal-backdrop">
                    <button onClick={() => setOpen(false)}>Close</button>
                </div>
            </div>
        </>
    )
}
