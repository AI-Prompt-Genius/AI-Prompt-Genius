import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import k from "../i18n/keys"
import Head2 from "./Head2"
import { GoogleIcon } from "./icons/Icons"
import {
    confirmPasswordReset,
    isFullscreenTab,
    mfaChallenge,
    mfaVerify,
    PENDING_AUTH_KEY,
    PENDING_AUTH_STEP_KEY,
    PENDING_RESET_KEY,
    requestPasswordReset,
    signInPassword,
    signUpPassword,
    startGoogleSignIn,
    verifyEmail,
    type AuthStep,
} from "../auth/customAuth"

// Custom sign-in UI (replaces the hosted AuthKit page). Email/password runs fully inline — it
// works inside the sidebar iframe. Google is a redirect and routes through the fullscreen tab
// when framed. Opened from anywhere via: window.dispatchEvent(new Event("open-auth-modal")).

export const OPEN_AUTH_EVENT = "open-auth-modal"
// Dispatched by App when a Google sign-in popup returns a step that needs another interaction
// (email verification / MFA) — the live app can't rely on the mount-time PENDING_AUTH_STEP read
// because there's no page reload, so it hands the step straight to the modal via this event.
export const RESUME_AUTH_STEP_EVENT = "resume-auth-step"

type Screen =
    | "form"
    | "verify-email"
    | "mfa"
    | "reset-request"
    | "reset-sent"
    | "reset-confirm"

export default function AuthModal() {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    const [screen, setScreen] = useState<Screen>("form")
    const [mode, setMode] = useState<"signin" | "signup">("signin")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [code, setCode] = useState("")
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState("")
    // Interstitial state carried between steps
    const [pendingToken, setPendingToken] = useState("")
    const [challengeId, setChallengeId] = useState("")
    const [resetToken, setResetToken] = useState("")

    useEffect(() => {
        const openHandler = () => {
            setOpen(true)
            setScreen("form")
            setError("")
        }
        window.addEventListener(OPEN_AUTH_EVENT, openHandler)
        return () => window.removeEventListener(OPEN_AUTH_EVENT, openHandler)
    }, [])

    // Google sign-in handed off from the side panel (which can't host the OAuth popup): the
    // fullscreen tab it opened lands here with pendingAuth=google. Open on the form so the user
    // clicks "Continue with Google" once more — that click's gesture lets the popup open, and the
    // fullscreen tab is persistent so its window.opener survives the callback.
    useEffect(() => {
        if (!isFullscreenTab()) return
        if (localStorage.getItem(PENDING_AUTH_KEY) !== "google") return
        localStorage.removeItem(PENDING_AUTH_KEY)
        setScreen("form")
        setError("")
        setOpen(true)
    }, [])

    // A password-reset link was followed: initAuth stashed the token, so open on the reset screen.
    useEffect(() => {
        const token = localStorage.getItem(PENDING_RESET_KEY)
        if (!token) return
        localStorage.removeItem(PENDING_RESET_KEY)
        setResetToken(token)
        setScreen("reset-confirm")
        setError("")
        setOpen(true)
    }, [])

    // A Google sign-in came back needing another step (usually email verification to link the
    // Google login onto an existing password account): the fallback full-tab flow stashed the step
    // for this mount-time read; the live popup flow hands it over via RESUME_AUTH_STEP_EVENT.
    useEffect(() => {
        const resume = (step: AuthStep) => {
            setOpen(true)
            void handleStep(step)
        }
        const raw = localStorage.getItem(PENDING_AUTH_STEP_KEY)
        if (raw) {
            localStorage.removeItem(PENDING_AUTH_STEP_KEY)
            try {
                resume(JSON.parse(raw) as AuthStep)
            } catch {
                /* malformed stash — ignore */
            }
        }
        const eventHandler = (e: Event) => {
            const step = (e as CustomEvent<AuthStep>).detail
            if (step) resume(step)
        }
        window.addEventListener(RESUME_AUTH_STEP_EVENT, eventHandler)
        return () => window.removeEventListener(RESUME_AUTH_STEP_EVENT, eventHandler)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (!open) return null

    function close() {
        setOpen(false)
        setPassword("")
        setConfirmPassword("")
        setCode("")
        setError("")
        setResetToken("")
    }

    async function handleStep(step: AuthStep) {
        if (step.status === "complete") {
            close()
            window.dispatchEvent(new Event("auth-changed"))
            // First sync right away so a new device pulls the library immediately.
            import("../sync/syncClient").then(m => m.cloudSyncNow())
            return
        }
        if (step.status === "email_verification_required") {
            setPendingToken(step.pendingAuthenticationToken ?? "")
            // On a Google-link resume the user never typed their email; use the one WorkOS returns
            // so the "we sent a code to …" copy isn't blank.
            if (step.email) setEmail(step.email)
            setScreen("verify-email")
            setCode("")
            setError("")
            return
        }
        if (step.status === "mfa_challenge") {
            const totp = (step.factors ?? []).find(f => f.type === "totp")
            if (!totp) {
                setError(t(k.AUTH_ERR_NO_FACTOR))
                return
            }
            setPendingToken(step.pendingAuthenticationToken ?? "")
            const ch = await mfaChallenge(totp.id)
            if (ch.status === "ok" && ch.authenticationChallengeId) {
                setChallengeId(ch.authenticationChallengeId)
                setScreen("mfa")
                setCode("")
                setError("")
            } else {
                setError(ch.message ?? t(k.AUTH_ERR_CHALLENGE_START))
            }
            return
        }
        setError(step.message ?? t(k.AUTH_ERR_GENERIC))
    }

    async function submitForm() {
        if (busy || !email.includes("@") || password.length < 1) return
        if (mode === "signup" && password !== confirmPassword) {
            setError(t(k.AUTH_ERR_PASSWORD_MISMATCH))
            return
        }
        setBusy(true)
        setError("")
        const step =
            mode === "signin"
                ? await signInPassword(email.trim(), password)
                : await signUpPassword(email.trim(), password)
        setBusy(false)
        await handleStep(step)
    }

    async function submitResetRequest() {
        if (busy || !email.includes("@")) return
        setBusy(true)
        setError("")
        await requestPasswordReset(email.trim())
        setBusy(false)
        // Always advance — the worker never reveals whether the address has an account.
        setScreen("reset-sent")
    }

    async function submitResetConfirm() {
        if (busy || password.length < 1) return
        if (password !== confirmPassword) {
            setError(t(k.AUTH_ERR_PASSWORD_MISMATCH))
            return
        }
        setBusy(true)
        setError("")
        const step = await confirmPasswordReset(resetToken, password)
        setBusy(false)
        await handleStep(step)
    }

    async function submitCode() {
        if (busy || code.trim().length < 6) return
        setBusy(true)
        setError("")
        const step =
            screen === "verify-email"
                ? await verifyEmail(pendingToken, code.trim())
                : await mfaVerify(pendingToken, challengeId, code.trim())
        setBusy(false)
        await handleStep(step)
    }

    return (
        <>
            <input defaultChecked type="checkbox" id="auth-modal" className="modal-toggle hidden" />
            <div className="modal">
                <div className="modal-box max-w-md" id="auth-modal-box">
                    {screen === "form" && (
                        <>
                            <Head2>
                                {mode === "signin"
                                    ? t(k.AUTH_SIGN_IN)
                                    : t(k.AUTH_CREATE_YOUR_ACCOUNT)}
                            </Head2>
                            <p className="text-sm mb-3">{t(k.AUTH_SUBTITLE)}</p>
                            <button
                                id="auth-google"
                                className="btn btn-outline w-full mb-3 gap-2"
                                onClick={() => {
                                    startGoogleSignIn()
                                    close()
                                }}
                            >
                                <GoogleIcon />
                                {t(k.AUTH_CONTINUE_WITH_GOOGLE)}
                            </button>
                            <div className="divider text-xs">{t(k.AUTH_OR_USE_EMAIL)}</div>
                            <input
                                id="auth-email"
                                type="email"
                                className="input input-bordered w-full mb-2"
                                placeholder="you@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                            <input
                                id="auth-password"
                                type="password"
                                className="input input-bordered w-full mb-3"
                                placeholder={
                                    mode === "signin"
                                        ? t(k.AUTH_PASSWORD)
                                        : t(k.AUTH_CHOOSE_PASSWORD)
                                }
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === "Enter") submitForm()
                                }}
                            />
                            {mode === "signup" && (
                                <input
                                    id="auth-password-confirm"
                                    type="password"
                                    className="input input-bordered w-full mb-3"
                                    placeholder={t(k.AUTH_CONFIRM_PASSWORD)}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === "Enter") submitForm()
                                    }}
                                />
                            )}
                            <button
                                id="auth-submit"
                                className="btn btn-primary w-full"
                                disabled={busy}
                                onClick={submitForm}
                            >
                                {busy
                                    ? t(k.AUTH_WORKING)
                                    : mode === "signin"
                                    ? t(k.AUTH_SIGN_IN)
                                    : t(k.AUTH_CREATE_ACCOUNT)}
                            </button>
                            {mode === "signin" && (
                                <p className="text-sm mt-3 text-center">
                                    <a
                                        className="link link-primary"
                                        id="auth-forgot-password"
                                        onClick={() => {
                                            setScreen("reset-request")
                                            setError("")
                                        }}
                                    >
                                        {t(k.AUTH_FORGOT_PASSWORD)}
                                    </a>
                                </p>
                            )}
                            <p className="text-sm mt-3 text-center">
                                {mode === "signin" ? (
                                    <>
                                        {t(k.AUTH_NEW_HERE)}{" "}
                                        <a
                                            className="link link-primary"
                                            id="auth-switch-signup"
                                            onClick={() => {
                                                setMode("signup")
                                                setConfirmPassword("")
                                                setError("")
                                            }}
                                        >
                                            {t(k.AUTH_CREATE_AN_ACCOUNT)}
                                        </a>
                                    </>
                                ) : (
                                    <>
                                        {t(k.AUTH_ALREADY_HAVE_ACCOUNT)}{" "}
                                        <a
                                            className="link link-primary"
                                            id="auth-switch-signin"
                                            onClick={() => {
                                                setMode("signin")
                                                setConfirmPassword("")
                                                setError("")
                                            }}
                                        >
                                            {t(k.AUTH_SIGN_IN)}
                                        </a>
                                    </>
                                )}
                            </p>
                        </>
                    )}

                    {(screen === "verify-email" || screen === "mfa") && (
                        <>
                            <Head2>
                                {screen === "verify-email"
                                    ? t(k.AUTH_CHECK_YOUR_EMAIL)
                                    : t(k.AUTH_TWO_FACTOR)}
                            </Head2>
                            <p className="text-sm mb-3">
                                {screen === "verify-email"
                                    ? t(k.AUTH_EMAIL_CODE_SENT, { email })
                                    : t(k.AUTH_ENTER_AUTH_CODE)}
                            </p>
                            <input
                                id="auth-code"
                                inputMode="numeric"
                                autoFocus
                                className="input input-bordered w-full mb-3 tracking-widest text-center"
                                placeholder="123456"
                                value={code}
                                maxLength={6}
                                onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                                onKeyDown={e => {
                                    if (e.key === "Enter") submitCode()
                                }}
                            />
                            <button
                                id="auth-code-submit"
                                className="btn btn-primary w-full"
                                disabled={busy || code.length < 6}
                                onClick={submitCode}
                            >
                                {busy ? t(k.AUTH_VERIFYING) : t(k.AUTH_VERIFY)}
                            </button>
                        </>
                    )}

                    {screen === "reset-request" && (
                        <>
                            <Head2>{t(k.AUTH_RESET_YOUR_PASSWORD)}</Head2>
                            <p className="text-sm mb-3">{t(k.AUTH_RESET_SUBTITLE)}</p>
                            <input
                                id="auth-reset-email"
                                type="email"
                                autoFocus
                                className="input input-bordered w-full mb-3"
                                placeholder="you@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === "Enter") submitResetRequest()
                                }}
                            />
                            <button
                                id="auth-reset-submit"
                                className="btn btn-primary w-full"
                                disabled={busy || !email.includes("@")}
                                onClick={submitResetRequest}
                            >
                                {busy ? t(k.AUTH_SENDING) : t(k.AUTH_SEND_RESET_LINK)}
                            </button>
                            <p className="text-sm mt-3 text-center">
                                <a
                                    className="link link-primary"
                                    id="auth-reset-back"
                                    onClick={() => {
                                        setScreen("form")
                                        setError("")
                                    }}
                                >
                                    {t(k.AUTH_BACK_TO_SIGN_IN)}
                                </a>
                            </p>
                        </>
                    )}

                    {screen === "reset-sent" && (
                        <>
                            <Head2>{t(k.AUTH_CHECK_YOUR_EMAIL)}</Head2>
                            <p className="text-sm mb-3">{t(k.AUTH_RESET_SENT, { email })}</p>
                            <button
                                id="auth-reset-done"
                                className="btn btn-primary w-full"
                                onClick={() => {
                                    setScreen("form")
                                    setError("")
                                }}
                            >
                                {t(k.AUTH_BACK_TO_SIGN_IN)}
                            </button>
                        </>
                    )}

                    {screen === "reset-confirm" && (
                        <>
                            <Head2>{t(k.AUTH_SET_NEW_PASSWORD)}</Head2>
                            <p className="text-sm mb-3">{t(k.AUTH_SET_NEW_PASSWORD_SUBTITLE)}</p>
                            <input
                                id="auth-reset-password"
                                type="password"
                                autoFocus
                                className="input input-bordered w-full mb-2"
                                placeholder={t(k.AUTH_NEW_PASSWORD_PLACEHOLDER)}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <input
                                id="auth-reset-password-confirm"
                                type="password"
                                className="input input-bordered w-full mb-3"
                                placeholder={t(k.AUTH_CONFIRM_NEW_PASSWORD)}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === "Enter") submitResetConfirm()
                                }}
                            />
                            <button
                                id="auth-reset-confirm-submit"
                                className="btn btn-primary w-full"
                                disabled={busy || password.length < 1}
                                onClick={submitResetConfirm}
                            >
                                {busy ? t(k.AUTH_SAVING) : t(k.AUTH_SAVE_NEW_PASSWORD)}
                            </button>
                        </>
                    )}

                    {error && (
                        <div className="alert alert-error mt-3 text-sm" id="auth-error">
                            <span>{error}</span>
                        </div>
                    )}
                </div>
                <div className="modal-backdrop">
                    <button onClick={close}>{t(k.CLOSE)}</button>
                </div>
            </div>
        </>
    )
}
