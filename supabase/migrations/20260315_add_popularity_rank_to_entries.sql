-- Add popularity_rank column to entries table.
-- Stores the market popularity rank (1 = most popular, 2 = second, etc.)
-- for each horse within a race. NULL is allowed for races where popularity
-- data is not yet available.

ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS popularity_rank integer;

-- Optional: add an index for queries that filter or sort by popularity rank
-- (e.g. finding the top-N favorites in a race).
CREATE INDEX IF NOT EXISTS entries_popularity_rank_idx
  ON entries (race_id, popularity_rank ASC NULLS LAST);
