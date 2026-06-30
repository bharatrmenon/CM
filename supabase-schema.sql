-- ChartMatch — leaderboard schema
-- Run this in the Supabase dashboard → SQL Editor → New query → Run.

-- 1) Profiles / scores table (one row per user)
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 24),
  xp            integer not null default 0,
  best_streak   integer not null default 0,
  total_calls   integer not null default 0,
  correct_calls integer not null default 0,
  accuracy      integer not null default 0,   -- whole-number percent
  updated_at    timestamptz not null default now()
);

-- Index for the leaderboard ordering
create index if not exists profiles_xp_idx on public.profiles (xp desc);

-- 2) Enable Row Level Security (REQUIRED — tables made via SQL are not protected by default)
alter table public.profiles enable row level security;

-- 3) Policies
-- Anyone (even logged-out) can READ the board:
create policy "leaderboard is public"
  on public.profiles for select
  using (true);

-- A user may INSERT only their own row:
create policy "insert own row"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- A user may UPDATE only their own row:
create policy "update own row"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Note: scoring currently happens in the browser, so this prevents users from
-- editing OTHERS' scores but not from inflating their OWN. Server-side validation
-- (see LAUNCH.md §5) is the hardening step before that matters competitively.
