import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import k from "../i18n/keys"
import Head2 from "./Head2"
import { deleteAccount, mfaChallenge, mfaEnroll, mfaVerifyEnroll, userEmail } from "../auth/customAuth"
import { cloudSignOut, cloudSyncNow } from "../sync/syncClient"

// Account management: shows the signed-in identity, manual sync, and TOTP 2FA enrollment
// (WorkOS returns the QR as a data URI — scan with any authenticator app; it's enforced at the
// next sign-in). Opened via: window.dispatchEvent(new Event("open-account-modal")).

export const OPEN_ACCOUNT_EVENT = "open-account-modal"

export default function ManageAccountModal() {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState("")
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [secret, setSecret] = useState<string | null>(null)
    const [factorId, setFactorId] = useState<string | null>(null)
    const [code, setCode] = useState("")
    const [activated, setActivated] = useState(false)
    const [syncMsg, setSyncMsg] = useState("")
    const [confirmingDelete, setConfirmingDelete] = useState(false)
    const [confirmEmail, setConfirmEmail] = useState("")

    useEffect(() => {
        const openHandler = () => {
            setOpen(true)
            setError("")
            setSyncMsg("")
            setConfirmingDelete(false)
            setConfirmEmail("")
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
            setError(step.message ?? t(k.ACCOUNT_ERR_ENROLL))
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
            setError(ch.message ?? t(k.ACCOUNT_ERR_VERIFY))
            return
        }
        const res = await mfaVerifyEnroll(ch.authenticationChallengeId, code.trim())
        setBusy(false)
        if (res.status === "ok") {
            setActivated(true)
            setError("")
        } else {
            setError(res.message ?? t(k.ACCOUNT_ERR_CODE_MISMATCH))
        }
    }

    async function syncNow() {
        if (busy) return
        setBusy(true)
        const ok = await cloudSyncNow()
        setBusy(false)
        setSyncMsg(ok ? t(k.ACCOUNT_SYNCED) : t(k.ACCOUNT_SYNC_FAILED))
    }

    // Strict-confirmed, irreversible account deletion: the typed email must match the signed-in
    // address before the button enables. On success we clear the local session (local prompts are
    // left untouched) and broadcast auth-changed so the sidebar flips to signed-out.
    async function deleteMyAccount() {
        if (busy || confirmEmail.trim().toLowerCase() !== (userEmail() ?? "").toLowerCase()) return
        setBusy(true)
        setError("")
        const step = await deleteAccount()
        if (step.status === "ok") {
            await cloudSignOut()
            window.dispatchEvent(new Event("auth-changed"))
            setOpen(false)
        } else {
            setBusy(false)
            setError(step.message ?? t(k.ACCOUNT_ERR_DELETE))
        }
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
                    <Head2>{t(k.ACCOUNT_TITLE)}</Head2>
                    <p className="mb-3">
                        {t(k.ACCOUNT_SIGNED_IN_AS)}{" "}
                        <strong id="account-modal-email">{userEmail()}</strong>{" "}
                        {t(k.ACCOUNT_SYNC_AUTO_SUFFIX)}
                    </p>

                    <div className="flex gap-2 mb-4">
                        <button
                            id="account-modal-sync"
                            className="btn btn-sm"
                            disabled={busy}
                            onClick={syncNow}
                        >
                            {busy ? t(k.AUTH_WORKING) : t(k.ACCOUNT_SYNC_NOW)}
                        </button>
                        {syncMsg && <span className="self-center text-sm">{syncMsg}</span>}
                    </div>

                    <div className="divider text-xs">{t(k.AUTH_TWO_FACTOR)}</div>
                    {!qrCode ? (
                        <>
                            <p className="text-sm mb-3">{t(k.ACCOUNT_2FA_INTRO)}</p>
                            <button
                                id="account-enroll-2fa"
                                className="btn btn-outline btn-sm"
                                disabled={busy}
                                onClick={enroll2fa}
                            >
                                {t(k.ACCOUNT_SETUP_2FA)}
                            </button>
                        </>
                    ) : activated ? (
                        <div className="alert alert-success text-sm" id="account-2fa-done">
                            <span>{t(k.ACCOUNT_2FA_ON)}</span>
                        </div>
                    ) : (
                        <div className="text-sm">
                            <p className="mb-2">{t(k.ACCOUNT_2FA_SCAN)}</p>
                            <img
                                id="account-2fa-qr"
                                src={qrCode}
                                alt={t(k.ACCOUNT_2FA_QR_ALT)}
                                className="w-40 h-40 mx-auto my-2"
                            />
                            {secret && (
                                <p className="text-xs opacity-70 break-all mb-3">
                                    {t(k.ACCOUNT_2FA_MANUAL_KEY)} {secret}
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
                                {busy ? t(k.AUTH_VERIFYING) : t(k.ACCOUNT_2FA_CONFIRM)}
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="alert alert-error mt-3 text-sm">
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="divider text-xs text-error">
                        {t(k.ACCOUNT_DANGER_ZONE)}
                    </div>
                    {!confirmingDelete ? (
                        <>
                            <p className="text-sm mb-3">{t(k.ACCOUNT_DELETE_INTRO)}</p>
                            <button
                                id="account-delete"
                                className="btn btn-outline btn-error btn-sm"
                                disabled={busy}
                                onClick={() => {
                                    setConfirmingDelete(true)
                                    setError("")
                                }}
                            >
                                {t(k.ACCOUNT_DELETE_BTN)}
                            </button>
                        </>
                    ) : (
                        <div className="text-sm">
                            <p className="mb-1">
                                {t(k.ACCOUNT_DELETE_CONFIRM_PROMPT, {
                                    email: userEmail() ?? "",
                                })}
                            </p>
                            <p className="text-xs opacity-70 mb-3">
                                {t(k.ACCOUNT_DELETE_LOCAL_NOTE)}
                            </p>
                            <input
                                id="account-delete-email"
                                type="email"
                                autoComplete="off"
                                className="input input-bordered w-full mb-3"
                                placeholder={t(k.ACCOUNT_DELETE_TYPE_EMAIL)}
                                value={confirmEmail}
                                onChange={e => setConfirmEmail(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === "Enter") deleteMyAccount()
                                }}
                            />
                            <div className="flex gap-2">
                                <button
                                    id="account-delete-confirm"
                                    className="btn btn-error btn-sm flex-1"
                                    disabled={
                                        busy ||
                                        confirmEmail.trim().toLowerCase() !==
                                            (userEmail() ?? "").toLowerCase()
                                    }
                                    onClick={deleteMyAccount}
                                >
                                    {busy
                                        ? t(k.ACCOUNT_DELETING)
                                        : t(k.ACCOUNT_DELETE_CONFIRM_BTN)}
                                </button>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    disabled={busy}
                                    onClick={() => {
                                        setConfirmingDelete(false)
                                        setConfirmEmail("")
                                    }}
                                >
                                    {t(k.ACCOUNT_DELETE_CANCEL)}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="modal-backdrop">
                    <button onClick={() => setOpen(false)}>{t(k.CLOSE)}</button>
                </div>
            </div>
        </>
    )
}
