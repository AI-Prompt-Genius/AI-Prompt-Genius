// Custom-UI auth endpoints: thin proxy over the WorkOS User Management API so the SPA never sees
// the secret API key. The SPA renders its own sign-in/sign-up/2FA screens and calls these.
//
// Passkeys are intentionally not supported (WorkOS only offers them on the hosted AuthKit page,
// which we no longer use). Google OAuth is initiated by the SPA (public authorize URL) and the
// code is exchanged here.
//
// Requires: `npx wrangler secret put WORKOS_API_KEY` (dashboard → API Keys, sk_...).

export interface AuthEnv {
    WORKOS_CLIENT_ID: string
    WORKOS_API_KEY?: string
}

const WORKOS = "https://api.workos.com"

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "content-type": "application/json",
            "access-control-allow-origin": "*",
            "access-control-allow-headers": "content-type, authorization",
            "access-control-allow-methods": "POST, OPTIONS",
        },
    })
}

async function workos(
    env: AuthEnv,
    path: string,
    body: Record<string, unknown>,
): Promise<Response> {
    // /authenticate authenticates the *client* via client_secret in the body (OAuth-style);
    // the management endpoints (create user, factor challenge) use the bearer header instead.
    const payload =
        path === "/user_management/authenticate"
            ? { ...body, client_secret: env.WORKOS_API_KEY }
            : body
    return fetch(`${WORKOS}${path}`, {
        method: "POST",
        headers: {
            authorization: `Bearer ${env.WORKOS_API_KEY}`,
            "content-type": "application/json",
        },
        body: JSON.stringify(payload),
    })
}

// Normalize WorkOS authenticate responses: success → tokens+user; known interstitial errors
// (email verification, MFA challenge) → structured "step" payloads the SPA can render.
async function relayAuthResult(res: Response): Promise<Response> {
    const data = (await res.json()) as any
    if (res.ok) {
        return json({
            status: "complete",
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            user: { id: data.user?.id, email: data.user?.email },
        })
    }
    const code = data.code ?? data.error
    if (code === "email_verification_required") {
        return json(
            {
                status: "email_verification_required",
                pendingAuthenticationToken: data.pending_authentication_token,
                email: data.email,
            },
            200,
        )
    }
    if (code === "mfa_challenge" || code === "mfa_enrollment") {
        return json(
            {
                status: "mfa_challenge",
                pendingAuthenticationToken: data.pending_authentication_token,
                factors: (data.authentication_factors ?? []).map((f: any) => ({
                    id: f.id,
                    type: f.type,
                })),
            },
            200,
        )
    }
    return json({ status: "error", code, message: data.message ?? "Authentication failed" }, 400)
}

export async function handleAuth(
    req: Request,
    env: AuthEnv,
    pathname: string,
    // Set by index.ts from a verified access token — the only trusted identity source.
    verifiedUserId: string | null,
): Promise<Response> {
    if (!env.WORKOS_API_KEY) {
        return json({ status: "error", message: "auth not configured (missing API key)" }, 500)
    }
    const body = (await req.json().catch(() => ({}))) as any

    switch (pathname) {
        case "/auth/signup": {
            const created = await workos(env, "/user_management/users", {
                email: body.email,
                password: body.password,
            })
            if (!created.ok) {
                const err = (await created.json()) as any
                return json(
                    { status: "error", code: err.code, message: err.message ?? "Sign-up failed" },
                    400,
                )
            }
            // Fall through to a normal password sign-in (may require email verification).
            return relayAuthResult(
                await workos(env, "/user_management/authenticate", {
                    client_id: env.WORKOS_CLIENT_ID,
                    grant_type: "password",
                    email: body.email,
                    password: body.password,
                }),
            )
        }

        case "/auth/signin":
            return relayAuthResult(
                await workos(env, "/user_management/authenticate", {
                    client_id: env.WORKOS_CLIENT_ID,
                    grant_type: "password",
                    email: body.email,
                    password: body.password,
                }),
            )

        case "/auth/verify-email":
            return relayAuthResult(
                await workos(env, "/user_management/authenticate", {
                    client_id: env.WORKOS_CLIENT_ID,
                    grant_type: "urn:workos:oauth:grant-type:email-verification:code",
                    pending_authentication_token: body.pendingAuthenticationToken,
                    code: body.code,
                }),
            )

        case "/auth/mfa/challenge": {
            const res = await fetch(
                `${WORKOS}/user_management/authentication_factors/${body.authenticationFactorId}/challenge`,
                {
                    method: "POST",
                    headers: { authorization: `Bearer ${env.WORKOS_API_KEY}` },
                },
            )
            const data = (await res.json()) as any
            if (!res.ok) return json({ status: "error", message: data.message }, 400)
            return json({
                status: "ok",
                authenticationChallengeId: data.id ?? data.authentication_challenge?.id,
            })
        }

        case "/auth/mfa/verify":
            return relayAuthResult(
                await workos(env, "/user_management/authenticate", {
                    client_id: env.WORKOS_CLIENT_ID,
                    grant_type: "urn:workos:oauth:grant-type:mfa-totp",
                    pending_authentication_token: body.pendingAuthenticationToken,
                    authentication_challenge_id: body.authenticationChallengeId,
                    code: body.code,
                }),
            )

        case "/auth/callback": // Google OAuth code exchange (SPA initiated the redirect)
            return relayAuthResult(
                await workos(env, "/user_management/authenticate", {
                    client_id: env.WORKOS_CLIENT_ID,
                    grant_type: "authorization_code",
                    code: body.code,
                }),
            )

        case "/auth/refresh":
            return relayAuthResult(
                await workos(env, "/user_management/authenticate", {
                    client_id: env.WORKOS_CLIENT_ID,
                    grant_type: "refresh_token",
                    refresh_token: body.refreshToken,
                }),
            )

        case "/auth/mfa/enroll": {
            // Identity comes strictly from the verified access token — enrolling a factor on an
            // arbitrary user id would be an account-takeover primitive.
            if (!verifiedUserId) return json({ status: "error", message: "unauthorized" }, 401)
            const res = await fetch(
                `${WORKOS}/user_management/users/${verifiedUserId}/auth_factors`,
                {
                    method: "POST",
                    headers: {
                        authorization: `Bearer ${env.WORKOS_API_KEY}`,
                        "content-type": "application/json",
                    },
                    body: JSON.stringify({ type: "totp", totp_issuer: "AI Prompt Genius" }),
                },
            )
            const data = (await res.json()) as any
            if (!res.ok) return json({ status: "error", message: data.message }, 400)
            // Response wraps the factor: { authentication_factor: {..., totp}, authentication_challenge }
            const factor = data.authentication_factor ?? data
            return json({
                status: "ok",
                factorId: factor.id,
                qrCode: factor.totp?.qr_code,
                secret: factor.totp?.secret,
            })
        }

        default:
            return json({ status: "error", message: "not found" }, 404)
    }
}
