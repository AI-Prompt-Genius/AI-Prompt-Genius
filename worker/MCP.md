# Pro MCP integration

The Worker serves a stateless, OAuth-protected Streamable HTTP MCP endpoint at
`https://lib.aipromptgenius.app/mcp`. It operates on the signed-in
account's **cloud-synced** library. Local-only prompts must be synced first.

## Rollout

1. Apply any outstanding migrations through `0007_pro_entitlements.sql`, then apply
   `migrations/0008_mcp.sql` to the existing D1 database before deploying the Worker.
   Use `schema.sql` only for a new database; do not replay it over an existing installation.
2. Provision a dedicated Workers KV namespace and set its ID on the `OAUTH_KV` binding
   in `wrangler.toml`. Wrangler can also provision an ID-less binding during deployment.
   Keep this namespace stable across deployments: it stores OAuth clients and grants.
3. Check `MCP_PUBLIC_URL`, `APP_ORIGIN`, the existing WorkOS configuration, and the D1
   binding for the target environment. MCP_PUBLIC_URL must be the externally reachable
   HTTPS URL ending in `/mcp`; APP_ORIGIN must be the library app's exact origin.
4. Deploy the Worker, then publish the matching web app/extension build through the
   project's usual release process. The frontend uses its existing sync API base URL.
   Keep the `MCP_USAGE` Durable Object binding and `mcp-usage-v1` SQLite class migration
   in the Worker configuration; Wrangler provisions this during deployment. Usage caps
   need no additional D1 migration. Missing/unavailable accounting blocks MCP tool calls.
5. In staging, sync a real Pro account, connect an OAuth-capable remote MCP client,
   approve the requested permissions, and exercise a disposable prompt/folder. Verify
   that changes reach the app and extension, then disconnect the client.

The settings page provides the endpoint, manual sync, and a disconnect-all button.
OAuth authorization opens the library app for sign-in and explicit permission selection.
Legacy Gumroad entitlement and the Stripe entitlement adapter both use the same server
gate. Stripe checkout and webhook ingestion remain a separate billing integration.

## Tools and permissions

| Scope | Tools |
| --- | --- |
| `library:read` | `fetch_prompts`, `list_folders` |
| `library:write` | `create_prompts`, `update_prompts`, `move_prompts`, `reorder_prompts`, `create_folders`, `rename_folder`, `reorder_folders` |
| `library:delete` | `delete_prompts`, `delete_folders` |

Clients should request read access alongside write/delete to inspect the library revision.
Omitting scopes defaults to read-only. Tools outside the granted scopes are unavailable.

- Fetch by explicit IDs or follow `nextCursor` to enumerate the whole library. Pages
  contain at most 100 prompts and target 512 KiB (a single existing large prompt may
  exceed that target). Pagination uses ID order; `sortIndex` specifies display order.
  Keep the same folder filter with each cursor; restart if the library revision changes.
- Create/update/move/reorder/delete prompts in batches of at most 100. Requests are
  limited to 1 MiB; use smaller batches for large prompt text. Updates preserve omitted
  fields. Prompt text and variable syntax are stored verbatim.
- Every mutation requires `expectedRevision` from the latest read/result and a fresh
  UUID `requestId`. Each successful batch is atomic. Retry identical arguments with the
  same request ID after a lost response; receipts last at least 24 hours. A changed
  operation needs a new ID. On revision conflict, reread and reconsider the change.
  Multiple batches are separate transactions, not one whole-library transaction.
- Reorder prompts by supplying `{ id, sortIndex }` positions. Fractional positions let
  clients move a few prompts without rewriting every row. Folder order requires every
  existing folder exactly once. Folders use the app's existing flat name-based model.
- Create destination folders before moving prompts. Renaming a folder updates all its
  contained prompts atomically and rejects collisions. Deleting folders preserves their
  prompts in Unfiled by default; `deleteContents: true` explicitly deletes them too.
  Both delete tools support `dryRun: true` to preview affected records.

## Security and storage costs

### Weekly and monthly allowances

Each Pro account receives **10,000 tool calls per calendar week** and **40,000 per
calendar month**, shared across all OAuth clients. The week resets Monday at 00:00 UTC;
the month resets on its first day at 00:00 UTC. Operators can adjust the positive integer
`MCP_WEEKLY_TOOL_LIMIT` and `MCP_MONTHLY_TOOL_LIMIT` Worker variables. Invalid values fall
back to these defaults.

A validated, scope-authorized tool call consumes one unit before the library operation.
A bulk operation is one call regardless of its prompt count. Dry runs, no-ops, retries,
and calls that subsequently encounter a library conflict/error count too. Discovery,
initialization, authentication failures, invalid tool arguments, and calls rejected by
the caps do not consume allowance. Reconnecting or refreshing a token does not reset it.

There is no usage meter, warning, or allowance metadata in successful responses. When
blocked, the MCP tool returns `isError: true` with `usage_limit_reached`, the blocking
period and cap, and an ISO UTC `resetsAt`. If both caps block access, it reports the later
reset. The app, sync, and other Pro features continue working normally.

One SQLite-backed Durable Object per account atomically maintains a single small counter
record. Counters reset lazily on use, without cron scans or growing event logs. Accounting
adds **zero D1 reads or writes**, but does use Durable Object requests/storage. It persists
across Worker restarts and serializes concurrent clients. Denied requests do not update
the record. No prompt content is stored in the counter.

### Access controls

OAuth uses Cloudflare's provider with discovery, dynamic client registration, client ID
metadata documents, authorization-code flow, and required S256 PKCE. Access tokens live
15 minutes; refresh tokens live 30 days. The account and allowed scopes come from the
verified token, never tool arguments. Refresh downscoping is enforced. An account epoch
in D1 makes disconnect-all effective on the next MCP request, including refreshed tokens.
Pro entitlement is checked on every request, subject to the bounded legacy-license cache
described in [ENTITLEMENTS.md](ENTITLEMENTS.md).

The server uses one indexed account read for access/Pro checks. It reuses that state for
the tool operation. Prompt reads use account/ID keysets and an indexed folder filter;
they do not write sessions or access logs to D1. OAuth records live in KV. Rate limiting
uses Cloudflare counters (60 requests per minute per user), not database writes.

Writes touch affected prompts, the existing account revision, and one receipt per bulk
mutation. Unchanged updates/order operations do not write or increment revisions. Folder
renames and content changes necessarily touch every contained prompt so existing delta
sync clients receive them. Expired receipts are cleaned by an indexed per-user delete
during later successful mutations; inactive users' receipts remain until another write
or account deletion. There is no scheduled full-table cleanup scan.

MCP changes use the existing sync revisions and tombstones. The app checks for changes on
focus and periodically while visible, and offers manual sync. Existing offline app edits
still follow the sync system's last-write-wins policy. MCP optimistic concurrency prevents
stale MCP writes, but does not change that existing offline conflict policy.

Native/server clients can omit Origin. Browser requests are restricted to APP_ORIGIN and
the MCP service origin. Supporting an additional browser origin requires an explicit
allowlist change. The endpoint supports POST; it does not allocate persistent sessions
or provide a long-lived GET event stream.

## Validation

Run `npm test` and `npm run build` at the repository root; run `npm test` and
`npm run typecheck` in `worker/`. The MCP integration tests use actual local D1/KV and
OAuth code exchange with mocked WorkOS identity. They cover scope enforcement, free
accounts, account isolation, refresh/downscope/revocation, bulk CRUD, ordering, folder
operations, concurrent conflicts, pagination, idempotency, and transaction rollback.

`npx wrangler deploy --dry-run` validates the deployment bundle without publishing it.
Local protocol tests do not replace the staging check with the intended third-party
MCP clients and live WorkOS/Gumroad configuration.

## Custom-domain routing

The library Pages project forwards `/mcp`, `/oauth/*`, and OAuth discovery paths to
this Worker using the `MCP_BACKEND` service binding in the repository-root Wrangler
configuration. `public/_worker.js` preserves the original request URL; this is required
for OAuth issuer and resource validation. `public/_routes.json` keeps ordinary static
asset requests outside the proxy. Deploy the Pages project as well as this Worker when
changing the public MCP URL. Existing clients using the old workers.dev URL should
reconnect with `https://lib.aipromptgenius.app/mcp`.
