-- Keep entitlements on the existing indexed account row: idle sync needs no extra query.
-- A synced key is only a candidate, never proof of purchase. No eager license backfill.
ALTER TABLE sync_state ADD COLUMN gumroad_key_hash TEXT;
ALTER TABLE sync_state ADD COLUMN gumroad_valid_until INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sync_state ADD COLUMN gumroad_check_after INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sync_state ADD COLUMN gumroad_unavailable INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sync_state ADD COLUMN stripe_pro_until INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sync_state ADD COLUMN stripe_version INTEGER NOT NULL DEFAULT 0;
