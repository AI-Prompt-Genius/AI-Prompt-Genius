# Account Pro entitlements

Pro is granted when either a verified legacy Gumroad license or a server-managed Stripe grant
is active. Both can coexist. A synced `proKey` is a verification candidate, never authorization.
Use `requirePro(DB, authenticatedUserId)` in future protected routes (including MCP), and check
its returned response before accessing data. The user ID must come from verified authentication,
never tool arguments or a request body. Ordinary cloud sync remains available to free users.

## Deployment

Apply `migrations/0007_pro_entitlements.sql` to the existing D1 database **before** deploying the
Worker. Migration 0006 must already be applied. New databases can use `schema.sql` directly.
Deploy the Worker before releasing the web app and extension. No new bindings, secrets, paid
services, or dependencies are needed for this foundation. This change has not deployed anything.

The migration adds six columns to the existing `sync_state` row. It does not scan purchases,
verify licenses in bulk, or create per-request history. Legacy keys are verified lazily on the
next sync or entitlement check. Old clients may continue syncing their keys; they cannot set
entitlement columns through `/sync`. To roll back code, leave the added columns in place.

## D1 usage

- Normal idle sync: **one indexed account-row read, zero writes**, including free users and
  users with a cached Gumroad or Stripe entitlement. No separate entitlement query is added.
- `/entitlements` and `requirePro`: one indexed account-row lookup on the cached path. Checking
  a new, unsynced account does not insert a row.
- Gumroad positive and negative verification results: cached for 24 hours on that same row.
  A verification refresh adds one conditional row update. Concurrent refreshes use compare-and-swap;
  losers reread the winning state. No module-level user cache, cross-account cache, or KV needed.
- Provider outages: retry no sooner than five minutes. Requests during backoff do not write or
  call Gumroad again. Expired/unverified access fails closed; an active Stripe grant still works.
- Stripe grants: one conditional update when the grant changes. Identical retries write zero rows.
  Expiration is evaluated against the clock, without a scheduled write.
- No entitlement-specific indexes (and their associated write cost), access timestamps, audit
  row per check, or cron scan of all accounts. Existing account deletion removes the entire row.

The integration tests assert D1's actual `rows_read` and `rows_written` metadata for the idle
path, alongside query counts. These are per-request measurements, not estimates of total account
usage. Initial sync/bootstrap retains its existing database cost.

## API and cache contract

`POST /entitlements` requires the existing WorkOS bearer token and returns:

```json
{
  "pro": true,
  "sources": ["gumroad"],
  "status": "verified",
  "validUntil": 1800000000000,
  "refreshAfter": 1800000000000
}
```

All timestamps are Unix **milliseconds**. `validUntil` is the latest active source expiry;
Gumroad access is additionally bounded by the verification cache's lifetime. `refreshAfter` is a
UI refresh deadline, not a token or authorization proof. Status responses are `no-store`.
An upstream failure without another active grant returns 503 (`unavailable`). A verified free
account returns 200 with `pro: false`. `requirePro` returns 403 for free accounts and 503 for
unknown provider status. Never grant access from an `unavailable` response.

Every `/sync` response includes the same `entitlement` object, including idle syncs. An upstream
license failure does not interrupt prompt sync. The client keeps only a bounded, account-scoped UI
cache on outages. Sign-out clears account membership; valid legacy keys remain available locally.
The extension mirror includes an expiry so keyless membership cannot be mirrored indefinitely.

`POST /license/verify` remains available for signed-out legacy users, without touching D1.
`POST /license/activate` preserves the existing legacy device-use increment and eight-use limit.
Routine verification never increments uses. Refunds, lost disputes and ended subscriptions are
not eligible; cancellation alone does not revoke remaining access. Invalid keys are not deleted
from the account on an outage or negative result, allowing support/re-verification without losing
another payment source.

## Stripe integration boundary (next stage)

`setStripeEntitlement(DB, userId, activeUntil, expectedVersion)` is an **internal function only**.
There is no browser-callable grant endpoint. The account must already have a `sync_state` row;
otherwise the adapter returns `conflict`. Future billing onboarding should initialize account
state through the shared sync/bootstrap path before checkout.

The future verified-webhook/reconciliation adapter must:

1. Map the Stripe customer to an authenticated account established at checkout; do not trust
   an incoming browser-supplied customer/account pairing.
2. Read `stripe_version`, retrieve current subscription state from Stripe, and derive a finite
   access deadline from paid/trial eligibility and the chosen grace-period policy.
3. Apply the grant with that expected version. On `conflict`, reread the version **and fetch current
   Stripe state again** before retrying. Stripe event timestamps are not CAS versions.
4. Use `activeUntil = 0` to revoke Stripe access; this does not touch legacy grants.
5. Reconcile missing events and future renewals. Handle refunds/disputes and account deletion with
   active billing explicitly. Deleting the local account row does not cancel a future Stripe subscription.

Do not set arbitrary far-future expiries for subscriptions. This foundation intentionally does
not select Stripe prices, implement checkout/customer portal/webhooks, create subscriptions,
or implement lifetime Stripe purchases. Those are subsequent billing integrations.
The Pro-gated MCP tools now use this entitlement foundation; see [MCP.md](MCP.md).

## Validation

Run the app's `npm test` and `npm run build`, plus `npm test` and `npm run typecheck` in `worker/`.
The Worker tests use local Miniflare/D1 and mocked provider responses; they never call live Gumroad
or Stripe. Before production rollout, smoke-test a real legacy purchase and account sign-in in
staging, then verify the extension mirror with and without a legacy key.
