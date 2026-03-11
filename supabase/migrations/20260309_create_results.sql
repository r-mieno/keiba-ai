-- Results table
-- Stores the actual finish result for each horse in a race.
-- Used for AI evaluation, accuracy tracking, ROI analysis, and value detection.

create table if not exists results (
  id               uuid primary key default gen_random_uuid(),
  race_id          uuid not null references races(id) on delete cascade,
  horse_id         uuid not null references horses(id) on delete cascade,
  finish_position  integer not null check (finish_position >= 1),
  odds             float   not null check (odds > 0),
  popularity       integer not null check (popularity >= 1),
  created_at       timestamptz not null default now(),

  -- One result row per horse per race
  unique (race_id, horse_id),
  -- Finish positions must be unique within a race
  unique (race_id, finish_position)
);

-- Index for looking up all results for a race (e.g. display finish order)
create index if not exists results_race_id_idx
  on results (race_id, finish_position asc);

-- Index for looking up all races a horse has run in
create index if not exists results_horse_id_idx
  on results (horse_id);

-- Enable Row Level Security (matches Supabase project defaults)
alter table results enable row level security;

-- Allow anonymous reads (same policy as races / horses tables)
create policy "Public read access"
  on results for select
  using (true);
