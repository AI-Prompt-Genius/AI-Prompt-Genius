-- Per-user account settings + Pro license sync.
-- `data`: JSON blob of device-portable settings (lng, theme, persist_variables), last-writer-wins
-- on `updated_at`. `pro_key`: Gumroad license key, sticky so Pro follows the account.
CREATE TABLE IF NOT EXISTS user_settings (
  user_id    TEXT PRIMARY KEY,
  data       TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL DEFAULT 0,
  pro_key    TEXT
);
