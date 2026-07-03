# AI Prompt Genius — Sync Worker (Feature 2 scaffold)

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

- **push**: `getObject("changedPrompts")` + `getObject("newPrompts")` → `prompts[]`,
  `getObject("deletedPrompts")` → `deletedPromptIds[]`, `usePromptStore.getState().folders` →
  `folders[]`, and the last-seen `rev` from `localStorage`.
- **apply pull**: merge the returned `prompts`/`folders` into the store via `replacePrompts` /
  `replaceFolders`, store the new `rev`, and clear the `changed/new/deleted` bookkeeping lists.

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
