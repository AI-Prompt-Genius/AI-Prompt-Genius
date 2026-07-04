# AI Prompt Genius — Production Handoff

_Context for continuing this work (human or a fresh Claude session). Last updated after the WorkOS
custom-auth + cloud-sync build._

## What this project is

A Chrome (MV3) extension. Two moving parts:

| Layer | Path | Deploys to | Store review? |
|---|---|---|---|
| **Extension shell** | `plugin/` | Chrome Web Store (zip) | ✅ yes (rare) |
| **Library web app** | `src/` → build → `dist/` | `https://lib.aipromptgenius.app` | ❌ no — ships freely |
| **Sync + auth backend** | `worker/` | Cloudflare Workers + D1 | ❌ (wrangler deploy) |

The shell embeds the web app in an **iframe**. This is deliberate: web-app changes deploy without a
store review. The extension side panel and a fullscreen tab both load the same web-app origin
(shared localStorage).

## What's DONE and verified

- **Phases A–D**: shell trimmed (v4.4.0, side-panel-first, ChatGPT `/`-autocomplete removed);
  full TypeScript conversion; **Zustand store + Dexie/IndexedDB** data layer (dual-written with
  localStorage, which stays canonical for now); **virtualized** prompt grid; **folder rename**.
- **Cloud sync** (`worker/src/index.ts`): Cloudflare Worker + D1, per-user **delta sync** (rev +
  tombstones). Verified E2E: push → D1 → pull restores on a "fresh device". Live at
  `https://aipromptgenius-sync.aipromptgenius.workers.dev` (D1 id in `worker/wrangler.toml`).
- **Auth = WorkOS custom UI** (hosted AuthKit page + `authkit-js` were dropped; **passkeys axed** —
  WorkOS only offers them hosted). `worker/src/auth.ts` proxies the WorkOS User Management API
  using the `WORKOS_API_KEY` **secret** (already set via `wrangler secret put`). Client ID
  `client_01KWG824DCYF7FGD93HWCYCMX7` (**WorkOS STAGING env**). SPA side: `src/auth/customAuth.ts`
  (tokens in localStorage, auto-refresh), `AuthModal` (email/password w/ **confirm-password on
  signup**, email verification, sign-in 2FA challenge, Google button), `ManageAccountModal`
  (Sync now + **2FA enroll with confirm-code-before-activation**), sidebar **Sign in / Manage
  account / Sign out** below Settings, `SyncChoice` onboarding step (local-only warning).
- **Hotfixes**: per-card modals `createPortal`ed to `<body>` (virtua's transform broke
  `position:fixed`); blank-prompt "Untitled prompt" label; Tailwind content globs fixed to include
  `ts,tsx` + `npm run css` regenerated (this had silently dropped `flex-1 min-h-0`, collapsing the
  grid to 0 height — the "prompts don't show up" bug).

## What's NOT done — the path to production

### 1. Deploy the web app to `lib.aipromptgenius.app`  ← BIGGEST BLOCKER
All the new code exists only locally + on the worker. **Nothing is live for real extension users
yet.** Need to: `npm run build` → deploy `dist/` to wherever `lib.aipromptgenius.app` is hosted
(Cloudflare Pages? Netlify? — **unknown, ask the user**). No store review needed. Until this ships,
signing in from the actual extension does nothing.

### 2. Create the WorkOS PRODUCTION environment
Currently everything points at WorkOS **staging** (`natural-spoon-78-staging.authkit.app`). Before
real users:
- Create the Production environment in the WorkOS dashboard; enable the same auth methods
  (Email+Password, Google, MFA/TOTP).
- Add redirect URI `https://lib.aipromptgenius.app/callback` and CORS origin
  `https://lib.aipromptgenius.app`.
- Get the **production Client ID** and **production API key** (`sk_live_...`).
- Wire per-env config: set `VITE_WORKOS_CLIENT_ID` at build time and `WORKOS_CLIENT_ID` in
  `worker/wrangler.toml`; `wrangler secret put WORKOS_API_KEY` with the live key.
  (Both currently hardcode the staging client id as a fallback in `customAuth.ts` /
  `worker/src/index.ts` / `worker/src/auth.ts`.)

### 3. Google consent-screen branding (optional, free)
Google login works but shows WorkOS's identity on the consent screen. To show "AI Prompt Genius":
create a Google Cloud OAuth client, put your app name/logo on the OAuth consent screen, and in the
WorkOS dashboard swap Google from "WorkOS-managed" to your own credentials. Logo needs Google
verification (days). No code change.

### 4. Finish the Google + 2FA runtime tests (need a human)
- **Google sign-in** and the **2FA enrollment→confirm→next-login-challenge** loop can't be tested
  headless (real Google session / phone authenticator required). Sign in via the modal, then
  Manage account → Set up 2FA → scan QR → enter code → confirm. Then sign out and back in to hit
  the TOTP challenge screen. If verify-enroll's WorkOS path is wrong it'll surface here
  (`worker/src/auth.ts` uses `/user_management/authentication_challenges/{id}/verify` — not yet
  exercised against live WorkOS).

### 5. Phase E cleanup (small shell release)
Once WorkOS auth is trusted in production: delete the legacy Google-Sheets sync
(`src/components/js/cloudSyncing.ts` + the "Legacy" block in `SettingsModal.tsx`), remove
`identity` + `oauth2` from `plugin/manifest.json`, and run the deferred
`worker/migrations/0002_drop_stub_users.sql`. Dropping Google auth **unblocks Firefox**.

### 6. Pre-launch hardening
- WorkOS `/auth/*` endpoints have no rate limiting — add some (Cloudflare rate-limit rule or KV).
- Make IndexedDB canonical and drop the localStorage dual-write once cloudSyncing.ts is gone.
- Compress the 3.6 MB `src/images/hotkeydemo.webp`; code-split the 13 i18n locales.

## Deferred features (post-launch)
- **Folder nesting / drag-and-drop** — needs a `folderId` migration (prompts currently store a
  bare `folder` string; deliberately deferred in Phase B).
- **Teams / sharing** — `worker/schema.sql` has stub notes; key rows by `workspace_id` + a
  memberships table.
- **Typed/advanced variables** (`{{tone:select:formal|casual}}`).

## How to work on it

```bash
npm run dev          # web app on :5173 (verify UI here; it's top-level so auth redirects work)
npm run typecheck    # tsc --noEmit (app)
npm run css          # REGENERATE Tailwind after adding any class — it's pregenerated, not live!
npm run build        # tsc + vite build → dist/
cd worker && npx wrangler deploy         # deploy backend
cd worker && npx tsc --noEmit            # typecheck worker
```

Verify UI changes visually (screenshots), not just via DOM queries — a 0-height grid reports fine
in the DOM but paints nothing.

## Landmines (read before touching these)
- **Tailwind is a static pregenerated `src/App.css`** (`npm run css`). New classes silently no-op
  until regenerated. Globs must include `ts,tsx`.
- **virtua transforms its row wrappers** → any `position:fixed` descendant (modals) must
  `createPortal` to `document.body`.
- **WorkOS `/authenticate` wants the API key as `client_secret` in the body**, not just the bearer
  header (header-only → `invalid_client`).
- **WorkOS access-token issuer** is `https://api.workos.com/user_management/<client_id>`, not bare
  `api.workos.com` (worker JWKS check depends on this).
- **`currentPrompts` mirror invariant**: `Ctrl+Shift+P` picker reads
  `chrome.storage.local.currentPrompts`, fed by the iframe's `sync_prompts` postMessage. The store
  posts it on every write; don't break it.
- App `handleMessage` must ignore non-string postMessage data (devtools/extensions post objects).

See also the auto-loaded memory files (`aipg-architecture-and-plan`, `aipg-verify-preview`) and the
plan at `~/.claude/plans/enumerated-herding-boole.md`.
