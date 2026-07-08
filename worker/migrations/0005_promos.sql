-- Promotions managed from the admin dashboard and polled by the extension
-- (plugin/background.js) instead of being hardcoded + shipped in each release.
-- `id` doubles as the client's seenPromos key, so a promo opens at most once per user.

CREATE TABLE IF NOT EXISTS promos (
  id         TEXT PRIMARY KEY,      -- stable slug/uuid; also the seenPromos key
  name       TEXT NOT NULL,         -- admin-facing label
  url        TEXT NOT NULL,         -- tab to open
  start_date TEXT NOT NULL,         -- 'YYYY-MM-DD' (inclusive)
  end_date   TEXT NOT NULL,         -- 'YYYY-MM-DD' (inclusive)
  active     INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
