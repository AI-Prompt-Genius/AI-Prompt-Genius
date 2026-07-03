import { sendMessageToParent } from "../components/js/utils"

// Custom-UI auth (WorkOS User Management, proxied through our worker so the secret API key never
// reaches the browser). Signing in is optional — no tokens means the app stays fully local.
//
// Methods: email/password (inline, works inside the sidebar iframe) and Google OAuth (initiated
// from our UI; the consent screen can't render inside the extension iframe, so from the sidebar
// it routes through the fullscreen tab via the `pendingAuth` flag — same origin, shared
// localStorage). Passkeys are deliberately not offered (WorkOS only supports them on the hosted
// page we no longer use).
//
// Tokens live in localStorage — deliberate: shared across the sidebar iframe and fullscreen tab,
// and immune to the third-party-cookie restrictions of the extension context. Tradeoff: XSS in
// the SPA could read them (standard SPA-token risk).

export const WORKER_URL = "https://aipromptgenius-sync.aipromptgenius.workers.dev"
const WORKOS_CLIENT_ID =
    import.meta.env.VITE_WORKOS_CLIENT_ID ?? "client_01KWG824DCYF7FGD93HWCYCMX7"

const ACCESS_KEY = "auth_access_token"
const REFRESH_KEY = "auth_refresh_token"
const SIGNED_IN_KEY = "authkit_signed_in" // kept from the previous flow so UI listeners still work
const EMAIL_KEY = "authkit_email"
const USER_ID_KEY = "auth_user_id"
const PENDING_AUTH_KEY = "pendingAuth"

export interface AuthStep {
    status: "complete" | "email_verification_required" | "mfa_challenge" | "error" | "ok"
    accessToken?: string
    refreshToken?: string
    user?: { id: string; email: string }
    pendingAuthenticationToken?: string
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

/** Start Google sign-in. Inside the sidebar iframe this routes through the fullscreen tab. */
export function startGoogleSignIn(): void {
    if (isInIframe()) {
        localStorage.setItem(PENDING_AUTH_KEY, "google")
        sendMessageToParent({ message: "openFullScreen" })
        return
    }
    window.location.href = googleAuthUrl()
}

// ---------- bootstrap (App load) ----------

/** Handle the Google ?code= callback and any sign-in handed over from the sidebar. */
export async function initAuth(): Promise<void> {
    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")
    if (code) {
        const step = await post("/auth/callback", { code })
        storeSession(step)
        window.history.replaceState({}, "", "/")
        return
    }
    if (!isInIframe() && localStorage.getItem(PENDING_AUTH_KEY) === "google") {
        localStorage.removeItem(PENDING_AUTH_KEY)
        if (!isSignedIn()) window.location.href = googleAuthUrl()
    }
}
