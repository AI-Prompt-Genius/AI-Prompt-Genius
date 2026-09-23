-- Transaction marker for atomic optimistic writes across the account and prompt rows.
ALTER TABLE sync_state ADD COLUMN mcp_write_id TEXT;
ALTER TABLE sync_state ADD COLUMN mcp_auth_epoch INTEGER NOT NULL DEFAULT 0;
-- Only a bulk mutation gets a receipt; reads, discovery, and idle sync never write one.
CREATE TABLE IF NOT EXISTS mcp_mutations (
  user_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  result TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, request_id)
);
CREATE INDEX IF NOT EXISTS idx_mcp_mutations_expiry ON mcp_mutations(user_id, created_at);
-- Folder-wide moves/renames/deletes do not scan unrelated accounts or folders.
CREATE INDEX IF NOT EXISTS idx_prompts_folder ON prompts(user_id, folder) WHERE deleted_at IS NULL;
