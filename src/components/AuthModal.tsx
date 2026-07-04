import { useEffect, useState } from "react"
import Head2 from "./Head2"
import {
    mfaChallenge,
    mfaVerify,
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

type Screen = "form" | "verify-email" | "mfa"

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

    useEffect(() => {
        const openHandler = () => {
            setOpen(true)
            setScreen("form")
            setError("")
        }
        window.addEventListener(OPEN_AUTH_EVENT, openHandler)
        return () => window.removeEventListener(OPEN_AUTH_EVENT, openHandler)
    }, [])

    if (!open) return null

    function close() {
        setOpen(false)
        setPassword("")
        setConfirmPassword("")
        setCode("")
        setError("")
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
                                className="btn btn-outline w-full mb-3"
                                onClick={() => {
                                    startGoogleSignIn()
                                    close()
                                }}
                            >
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

                    {screen !== "form" && (
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
