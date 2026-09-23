# AI Prompt Genius — Sync Worker (Feature 2 scaffold)

For the current Pro MCP integration, deployment prerequisites, and tool contract, see
[MCP.md](MCP.md). Pro entitlement behavior is documented in [ENTITLEMENTS.md](ENTITLEMENTS.md).
The scaffold notes below describe the original sync implementation.

Deployable Cloudflare Worker + D1 backend that replaces the Google-Sheets sync with a per-user
**delta** protocol (push only changed/deleted records, pull changes since your last `rev`). This is
a **scaffold** — it needs your Cloudflare account to deploy and cannot be verified from the repo.

## Deploy

```bash
cd worker
npm i -D wrangler
npx wrangler d1 create aipromptgenius          # paste database_id into wrangler.toml
npx wrangler d1 execute aipromptgenius --file=schema.sql
npx wrangler deploy                             # note the deployed URL
```

## Client integration (in `src/`)

The library app already tracks the exact deltas the `/sync` endpoint wants — reuse them:

-   **push**: send only changed/new prompts, prompt tombstones, and changed singleton state
    (`folderState`, settings, Pro key), together with the last-seen `rev`.
-   **apply pull**: merge returned prompt deltas and apply the authoritative versioned folder/settings
    state, store the returned persisted `rev`, and clear acknowledged bookkeeping lists.

Apply `migrations/0006_sync_state.sql` before deploying the matching Worker. It backfills the
singleton row used by the one-read, zero-write idle sync path.

Auth: the app opens a normal web login **inside the iframe** and stores the returned `token` in its
own `localStorage` — no `chrome.identity`, which is why Phase E can also delete `identity`/`oauth2`
from the manifest and unblock Firefox. Wire this into `SettingsModal`'s Cloud tab in place of the
Google-Sheets buttons, then delete `src/components/js/cloudSyncing.ts`.

## Teams (Feature 3)

Key rows by `workspace_id` instead of `user_id`, add `workspaces` + `memberships(role)` tables
(stubbed in `schema.sql`), and gate `/sync` on membership. Sharing a folder = sharing a workspace.

## Auth hardening

The token issuance in `/auth` is intentionally minimal. Before shipping, replace it with a
magic-link email flow (or OAuth) and rate-limit the endpoint.
