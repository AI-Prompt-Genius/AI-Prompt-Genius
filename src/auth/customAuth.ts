import { sendMessageToParent } from "../components/js/utils"

// Custom-UI auth (WorkOS User Management, proxied through our worker so the secret API key never
// reaches the browser). Signing in is optional — no tokens means the app stays fully local.
//
// Methods: email/password (inline, works inside the sidebar iframe) and Google OAuth. The Google
// consent screen can't render inside the extension iframe, so it opens in a POPUP whose
// `window.opener` points back at the embedded app; the callback hands the OAuth code to the opener
// so tokens land in the app's storage bucket, not a standalone first-party lib.aipromptgenius.app
// tab (Chrome partitions the embedded iframe's storage under the extension, so a first-party tab is
// a DIFFERENT bucket that would strand the tokens away from the user's prompts).
//
// The side panel can't host that popup: opening it steals focus and Chrome tears the panel (and its
// `window.opener`) down before the callback returns. So from the side panel we first route into a
// persistent fullscreen extension tab (same partition, shared via localStorage) and run the popup
// from there. See `startGoogleSignIn`, `initAuth`, and the `googleAuthCode` handler in App.tsx.
// Passkeys are deliberately not offered (WorkOS only supports them on the hosted page we dropped).
//
// Tokens live in localStorage — deliberate: shared across the sidebar iframe and fullscreen tab,
// and immune to the third-party-cookie restrictions of the extension context. Tradeoff: XSS in
// the SPA could read them (standard SPA-token risk).

export const WORKER_URL = "https://aipromptgenius-sync.aipromptgenius.workers.dev"
const WORKOS_CLIENT_ID =
    import.meta.env.VITE_WORKOS_CLIENT_ID ?? "client_01KWG8251AYSWRAXXKVHKZGSXN"

const ACCESS_KEY = "auth_access_token"
const REFRESH_KEY = "auth_refresh_token"
const SIGNED_IN_KEY = "authkit_signed_in" // kept from the previous flow so UI listeners still work
const EMAIL_KEY = "authkit_email"
const USER_ID_KEY = "auth_user_id"
export const PENDING_AUTH_KEY = "pendingAuth"
export const PENDING_RESET_KEY = "pendingResetToken"
// A Google callback that didn't complete in one shot (email verification / MFA) is stashed here
// for AuthModal to resume — localStorage is shared with the sidebar iframe, same as the reset flow.
export const PENDING_AUTH_STEP_KEY = "pendingAuthStep"

export interface AuthStep {
    status: "complete" | "email_verification_required" | "mfa_challenge" | "error" | "ok"
    accessToken?: string
    refreshToken?: string
    user?: { id: string; email: string }
    pendingAuthenticationToken?: string
    email?: string
    factors?: Array<{ id: string; type: string }>
    authenticationChallengeId?: string
    code?: string
    message?: string
    factorId?: string
    qrCode?: string
    secret?: string
}

function isInIframe(): boolean {
    try {
        return window.self !== window.top
    } catch {
        return true
    }
}

/** True in the persistent fullscreen extension tab (plugin/pages/fullscreen.html) — it embeds the
 * SPA with ?fullscreen=true, which distinguishes it from the focus-fragile side panel iframe. */
export function isFullscreenTab(): boolean {
    return new URLSearchParams(window.location.search).get("fullscreen") === "true"
}

async function post(path: string, body: unknown, token?: string): Promise<AuthStep> {
    try {
        const headers: Record<string, string> = { "content-type": "application/json" }
        if (token) headers.authorization = `Bearer ${token}`
        const res = await fetch(`${WORKER_URL}${path}`, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
        })
        return (await res.json()) as AuthStep
    } catch {
        return { status: "error", message: "Network error — please try again" }
    }
}

function storeSession(step: AuthStep): void {
    if (step.status !== "complete" || !step.accessToken) return
    localStorage.setItem(ACCESS_KEY, step.accessToken)
    if (step.refreshToken) localStorage.setItem(REFRESH_KEY, step.refreshToken)
    if (step.user) {
        localStorage.setItem(EMAIL_KEY, step.user.email)
        localStorage.setItem(USER_ID_KEY, step.user.id)
    }
    localStorage.setItem(SIGNED_IN_KEY, "true")
    localStorage.setItem("syncPreference", "cloud")
}

function jwtExp(token: string): number {
    try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))
        return (payload.exp ?? 0) * 1000
    } catch {
        return 0
    }
}

// ---------- session state ----------

export function isSignedIn(): boolean {
    return localStorage.getItem(SIGNED_IN_KEY) === "true" && !!localStorage.getItem(REFRESH_KEY)
}

export function userEmail(): string | null {
    return localStorage.getItem(EMAIL_KEY)
}

export function userId(): string | null {
    return localStorage.getItem(USER_ID_KEY)
}

/** Valid access token, refreshing through the worker when expired. Null when signed out. */
export async function getAccessToken(forceRefresh = false): Promise<string | null> {
    const access = localStorage.getItem(ACCESS_KEY)
    const refresh = localStorage.getItem(REFRESH_KEY)
    if (!refresh) return null
    // Refresh 30s before expiry to avoid using a token that dies mid-request.
    if (access && !forceRefresh && jwtExp(access) - 30_000 > Date.now()) return access
    const step = await post("/auth/refresh", { refreshToken: refresh })
    if (step.status === "complete") {
        storeSession(step)
        return step.accessToken ?? null
    }
    if (step.status === "error") signOutLocal()
    return null
}

function signOutLocal(): void {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(SIGNED_IN_KEY)
    localStorage.removeItem(EMAIL_KEY)
    localStorage.removeItem(USER_ID_KEY)
    localStorage.removeItem(PENDING_AUTH_KEY)
}

export async function signOut(): Promise<void> {
    signOutLocal()
    localStorage.setItem("syncPreference", "local")
}

// ---------- flows (consumed by AuthModal) ----------

export function signInPassword(email: string, password: string): Promise<AuthStep> {
    return post("/auth/signin", { email, password }).then(tap)
}

export function signUpPassword(email: string, password: string): Promise<AuthStep> {
    return post("/auth/signup", { email, password }).then(tap)
}

export function verifyEmail(pendingAuthenticationToken: string, code: string): Promise<AuthStep> {
    return post("/auth/verify-email", { pendingAuthenticationToken, code }).then(tap)
}

/** Ask WorkOS to email a reset link. Resolves { status: "ok" } even for unknown emails. */
export function requestPasswordReset(email: string): Promise<AuthStep> {
    return post("/auth/password-reset", { email })
}

/** Set a new password via the token from the emailed link, landing in a signed-in session. */
export function confirmPasswordReset(token: string, newPassword: string): Promise<AuthStep> {
    return post("/auth/password-reset/confirm", { token, newPassword }).then(tap)
}

export function mfaChallenge(authenticationFactorId: string): Promise<AuthStep> {
    return post("/auth/mfa/challenge", { authenticationFactorId })
}

export function mfaVerify(
    pendingAuthenticationToken: string,
    authenticationChallengeId: string,
    code: string,
): Promise<AuthStep> {
    return post("/auth/mfa/verify", {
        pendingAuthenticationToken,
        authenticationChallengeId,
        code,
    }).then(tap)
}

export async function mfaEnroll(): Promise<AuthStep> {
    const token = await getAccessToken()
    if (!token) return { status: "error", message: "Not signed in" }
    return post("/auth/mfa/enroll", {}, token)
}

/**
 * Permanently delete the signed-in user's cloud account: the worker purges all their synced
 * prompts/folders/settings and deletes their WorkOS login. Identity is taken server-side from the
 * access token, so there's nothing to pass. On success the caller should clear the local session
 * (see cloudSignOut). Local on-device prompts are left untouched.
 */
export async function deleteAccount(): Promise<AuthStep> {
    const token = await getAccessToken()
    if (!token) return { status: "error", message: "Not signed in" }
    return post("/auth/delete-account", {}, token)
}

/** Confirm a just-enrolled TOTP factor with a code from the user's authenticator app. */
export async function mfaVerifyEnroll(
    authenticationChallengeId: string,
    code: string,
): Promise<AuthStep> {
    const token = await getAccessToken()
    if (!token) return { status: "error", message: "Not signed in" }
    return post("/auth/mfa/verify-enroll", { authenticationChallengeId, code }, token)
}

function tap(step: AuthStep): AuthStep {
    storeSession(step)
    return step
}

// ---------- Google OAuth (initiated from our UI) ----------

export function googleAuthUrl(): string {
    const params = new URLSearchParams({
        client_id: WORKOS_CLIENT_ID,
        redirect_uri: `${window.location.origin}/callback`,
        response_type: "code",
        provider: "GoogleOAuth",
    })
    return `https://api.workos.com/user_management/authorize?${params}`
}

/**
 * Start Google sign-in.
 *
 * From the side panel we can't host the OAuth popup — opening it steals focus and Chrome tears the
 * panel down before the callback returns, killing the `window.opener` the code must post back to.
 * So the side panel hands off to a persistent fullscreen extension tab (flagged via `pendingAuth`
 * in the shared-partition localStorage); that tab auto-opens this modal and the user completes the
 * flow there. In the fullscreen tab (or a standalone page) we open the popup directly — its opener
 * stays alive, so the callback lands the tokens in this (correct) storage bucket. Popup blocked →
 * full-tab redirect fallback (completes but lands first-party; the user can retry).
 */
export function startGoogleSignIn(): void {
    if (isInIframe() && !isFullscreenTab()) {
        localStorage.setItem(PENDING_AUTH_KEY, "google")
        sendMessageToParent({ message: "openFullScreen" })
        return
    }
    const popup = window.open(
        googleAuthUrl(),
        "workos_google_signin",
        "width=500,height=650,menubar=no,toolbar=no,location=no,status=no",
    )
    if (!popup) {
        // Escape the iframe for the fallback — WorkOS's authorize page refuses to render framed.
        ;(window.top ?? window).location.href = googleAuthUrl()
    }
}

// ---------- bootstrap (App load) ----------

/**
 * Exchange a Google `?code=` for a session. Returns the step so the caller can react — a
 * non-`complete` status (email-verification / MFA to link the Google login onto an existing
 * password account, or a hard error) is handed to AuthModal rather than stored.
 */
export async function completeGoogleCode(code: string): Promise<AuthStep> {
    const step = await post("/auth/callback", { code })
    if (step.status === "complete") storeSession(step)
    return step
}

/** Handle the Google ?code= callback (and the emailed password-reset ?token=) on app load. */
export async function initAuth(): Promise<void> {
    const params = new URLSearchParams(window.location.search)
    // The emailed password-reset link lands here with ?token=. Stash it (localStorage is shared
    // with the sidebar iframe) and clear the URL; AuthModal opens the reset screen on mount.
    const resetToken = params.get("token")
    if (resetToken) {
        localStorage.setItem(PENDING_RESET_KEY, resetToken)
        window.history.replaceState({}, "", "/")
        return
    }
    const code = params.get("code")
    if (code) {
        // Google sign-in runs in a popup so its tokens land in the embedded app's storage bucket,
        // not this throwaway first-party one. If we're that popup, hand the code back to the opener
        // (the embedded app — same origin, correct bucket) and close; it finishes the exchange.
        if (window.opener && window.opener !== window) {
            window.opener.postMessage(
                JSON.stringify({ message: "googleAuthCode", code }),
                window.location.origin,
            )
            window.close()
            return
        }
        // Fallback path (popup was blocked → full-tab redirect): exchange here and, if WorkOS needs
        // another step, stash it so AuthModal resumes on mount after this page settles.
        const step = await completeGoogleCode(code)
        if (step.status !== "complete") {
            localStorage.setItem(PENDING_AUTH_STEP_KEY, JSON.stringify(step))
        }
        window.history.replaceState({}, "", "/")
    }
}
