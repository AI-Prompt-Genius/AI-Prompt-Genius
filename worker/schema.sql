-- D1 schema for AI Prompt Genius sync. Delta sync is driven by a monotonic per-user `rev`;
-- deletes are tombstones (deleted_at set) so they propagate instead of resurrecting.

-- Identity: WorkOS AuthKit access-token JWT `sub` (validated against WorkOS JWKS in the worker).
-- No local users table; user_id below is the WorkOS user id.

CREATE TABLE IF NOT EXISTS prompts (
  user_id     TEXT NOT NULL,
  id          TEXT NOT NULL,
  title       TEXT,
  text        TEXT,
  description TEXT,
  tags        TEXT,                  -- semicolon-joined, matching the client's legacy shape
  folder      TEXT,
  sort_index  REAL NOT NULL DEFAULT 0, -- manual display order (fractional; lower = earlier)
  rev         INTEGER NOT NULL,      -- server rev at which this row last changed
  updated_at  INTEGER NOT NULL,     -- client lastChanged (last-writer-wins tiebreak)
  deleted_at  INTEGER,               -- tombstone; NULL = live
  PRIMARY KEY (user_id, id)
);
CREATE INDEX IF NOT EXISTS idx_prompts_rev ON prompts (user_id, rev);

CREATE TABLE IF NOT EXISTS folders (
  user_id    TEXT NOT NULL,
  name       TEXT NOT NULL,
  sort_index INTEGER NOT NULL DEFAULT 0,
  rev        INTEGER NOT NULL,
  deleted_at INTEGER,
  PRIMARY KEY (user_id, name)
);
CREATE INDEX IF NOT EXISTS idx_folders_rev ON folders (user_id, rev);

-- Per-user account settings + Pro license (Feature: settings/pro sync with the account).
-- Singleton row per user. `data` is a JSON blob of device-portable settings (language, theme,
-- persist_variables), last-writer-wins on `updated_at`. `pro_key` is the Gumroad license key and
-- is STICKY — the merge never clears it from a settings write, only an explicit deactivation — so
-- Pro follows the account across every signed-in device.
CREATE TABLE IF NOT EXISTS user_settings (
  user_id    TEXT PRIMARY KEY,
  data       TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL DEFAULT 0,
  pro_key    TEXT
);

-- Teams (Feature 3 extension): a workspace can own shared prompts/folders and members with roles.
-- Left as a documented next step — the sync endpoint keys everything by user_id today; swap that
-- for workspace_id + a membership check to share a library.
-- CREATE TABLE workspaces (...);
-- CREATE TABLE memberships (workspace_id, user_id, role);
