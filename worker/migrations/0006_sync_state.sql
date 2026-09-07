-- Singleton account state for the sync fast path. An unchanged client reads this one row and can
-- return without scanning prompts or writing settings/folders. Folder lists are intentionally a
-- JSON value: they are small, edited as one ordered set in the UI, and no longer need 2N rewrites.
CREATE TABLE IF NOT EXISTS sync_state (
  user_id             TEXT PRIMARY KEY,
  rev                 INTEGER NOT NULL DEFAULT 0,
  protocol_version    INTEGER NOT NULL DEFAULT 1,
  folders             TEXT NOT NULL DEFAULT '[]',
  folders_updated_at  INTEGER NOT NULL DEFAULT 0,
  settings_data       TEXT NOT NULL DEFAULT '{}',
  settings_updated_at INTEGER NOT NULL DEFAULT 0,
  pro_key              TEXT
);

-- Backfill every existing account. Correlated aggregates keep this migration compatible with the
-- manually-created original schema, which has no central users table.
WITH user_ids AS (
  SELECT user_id FROM prompts
  UNION
  SELECT user_id FROM folders
  UNION
  SELECT user_id FROM user_settings
)
INSERT INTO sync_state
  (user_id, rev, protocol_version, folders, folders_updated_at,
   settings_data, settings_updated_at, pro_key)
SELECT
  users.user_id,
  MAX(
    COALESCE((SELECT MAX(rev) FROM prompts WHERE prompts.user_id = users.user_id), 0),
    COALESCE((SELECT MAX(rev) FROM folders WHERE folders.user_id = users.user_id), 0)
  ),
  1,
  COALESCE((
    SELECT json_group_array(name)
    FROM (
      SELECT name
      FROM folders
      WHERE folders.user_id = users.user_id AND deleted_at IS NULL
      ORDER BY sort_index
    )
  ), '[]'),
  0,
  COALESCE((SELECT data FROM user_settings WHERE user_settings.user_id = users.user_id), '{}'),
  COALESCE((SELECT updated_at FROM user_settings WHERE user_settings.user_id = users.user_id), 0),
  (SELECT pro_key FROM user_settings WHERE user_settings.user_id = users.user_id)
FROM user_ids AS users
WHERE true
ON CONFLICT(user_id) DO NOTHING;

PRAGMA optimize;
