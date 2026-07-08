-- Manual prompt ordering (drag-to-reorder), synced cross-device.
-- `sort_index` is a fractional position key (lower = earlier); a reorder sets the moved prompt's
-- index to the midpoint between its new neighbors, so only that one row changes. Pulls order by it.
-- REAL to allow fractional midpoints between two adjacent integers without renumbering.
ALTER TABLE prompts ADD COLUMN sort_index REAL NOT NULL DEFAULT 0;
