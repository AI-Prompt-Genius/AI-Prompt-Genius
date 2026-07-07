import { useEffect, useState } from "react"
import Head2 from "./Head2"
import { GoogleIcon } from "./icons/Icons"
import {
    confirmPasswordReset,
    mfaChallenge,
    mfaVerify,
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
                setError("This account requires 2FA, but no authenticator factor was found.")
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
                setError(ch.message ?? "Couldn't start the 2FA challenge.")
            }
            return
        }
        setError(step.message ?? "Something went wrong — please try again.")
    }

    async function submitForm() {
        if (busy || !email.includes("@") || password.length < 1) return
        if (mode === "signup" && password !== confirmPassword) {
            setError("Passwords don't match — please re-enter them.")
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
            setError("Passwords don't match — please re-enter them.")
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
                            <Head2>{mode === "signin" ? "Sign in" : "Create your account"}</Head2>
                            <p className="text-sm mb-3">
                                Sync your prompts to every device. Signing in is optional — you can
                                keep using AI Prompt Genius locally without an account.
                            </p>
                            <button
                                id="auth-google"
                                className="btn btn-outline w-full mb-3 gap-2"
                                onClick={() => {
                                    startGoogleSignIn()
                                    close()
                                }}
                            >
                                <GoogleIcon />
                                Continue with Google
                            </button>
                            <div className="divider text-xs">or use email</div>
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
                                    mode === "signin" ? "Password" : "Choose a password (10+ chars)"
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
                                    placeholder="Confirm password"
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
                                    ? "Working…"
                                    : mode === "signin"
                                    ? "Sign in"
                                    : "Create account"}
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
                                        Forgot your password?
                                    </a>
                                </p>
                            )}
                            <p className="text-sm mt-3 text-center">
                                {mode === "signin" ? (
                                    <>
                                        New here?{" "}
                                        <a
                                            className="link link-primary"
                                            id="auth-switch-signup"
                                            onClick={() => {
                                                setMode("signup")
                                                setConfirmPassword("")
                                                setError("")
                                            }}
                                        >
                                            Create an account
                                        </a>
                                    </>
                                ) : (
                                    <>
                                        Already have an account?{" "}
                                        <a
                                            className="link link-primary"
                                            id="auth-switch-signin"
                                            onClick={() => {
                                                setMode("signin")
                                                setConfirmPassword("")
                                                setError("")
                                            }}
                                        >
                                            Sign in
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
                                    ? "Check your email"
                                    : "Two-factor authentication"}
                            </Head2>
                            <p className="text-sm mb-3">
                                {screen === "verify-email"
                                    ? `We sent a 6-digit code to ${email}. Enter it below to finish signing in.`
                                    : "Enter the 6-digit code from your authenticator app."}
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
                                {busy ? "Verifying…" : "Verify"}
                            </button>
                        </>
                    )}

                    {screen === "reset-request" && (
                        <>
                            <Head2>Reset your password</Head2>
                            <p className="text-sm mb-3">
                                Enter your account email and we'll send you a link to set a new
                                password.
                            </p>
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
                                {busy ? "Sending…" : "Send reset link"}
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
                                    Back to sign in
                                </a>
                            </p>
                        </>
                    )}

                    {screen === "reset-sent" && (
                        <>
                            <Head2>Check your email</Head2>
                            <p className="text-sm mb-3">
                                If an account exists for {email}, we've sent a link to reset your
                                password. It may take a minute to arrive — check your spam folder
                                too.
                            </p>
                            <button
                                id="auth-reset-done"
                                className="btn btn-primary w-full"
                                onClick={() => {
                                    setScreen("form")
                                    setError("")
                                }}
                            >
                                Back to sign in
                            </button>
                        </>
                    )}

                    {screen === "reset-confirm" && (
                        <>
                            <Head2>Set a new password</Head2>
                            <p className="text-sm mb-3">
                                Choose a new password for your account.
                            </p>
                            <input
                                id="auth-reset-password"
                                type="password"
                                autoFocus
                                className="input input-bordered w-full mb-2"
                                placeholder="New password (10+ chars)"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <input
                                id="auth-reset-password-confirm"
                                type="password"
                                className="input input-bordered w-full mb-3"
                                placeholder="Confirm new password"
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
                                {busy ? "Saving…" : "Save new password"}
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
                    <button onClick={close}>Close</button>
                </div>
            </div>
        </>
    )
}
