-- Blackjack Trainer: game data in Supabase.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to run again: everything uses "if not exists" or drops policies first.
--
-- Every browser signs in anonymously (Authentication -> Allow anonymous sign-ins),
-- so each player is a row in auth.users without email or password.
-- Row Level Security: a player can only read and write their own rows.
-- The project owner sees everything in the Table Editor (it uses the service role).

-- Players: one row per browser (anonymous user). No name, email or device data is stored.
create table if not exists public.players (
  id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Events: one row per hand, exam, drill answer, etc. The details live in "data".
--   app  : table | fast | strategy | hilo
--   kind : hand | exam | answer | ... (short label chosen by the app)
create table if not exists public.events (
  id bigint generated always as identity primary key,
  player_id uuid not null default auth.uid() references public.players (id) on delete cascade,
  app text not null check (app in ('table', 'fast', 'strategy', 'hilo')),
  kind text not null check (char_length(kind) between 1 and 40),
  at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) <= 16384)
);
create index if not exists events_player_at on public.events (player_id, at desc);
create index if not exists events_app_kind_at on public.events (app, kind, at desc);

-- Progress: the latest saved state of each app per player. Not used yet (kept for a later
-- "continue on another device" feature); the apps only write events today.
create table if not exists public.progress (
  player_id uuid not null default auth.uid() references public.players (id) on delete cascade,
  app text not null check (app in ('table', 'fast', 'strategy', 'hilo')),
  state jsonb not null check (pg_column_size(state) <= 1048576),
  updated_at timestamptz not null default now(),
  primary key (player_id, app)
);

alter table public.players enable row level security;
alter table public.events enable row level security;
alter table public.progress enable row level security;

-- Only signed-in (including anonymous) users get access; the public "anon" role gets nothing.
revoke all on public.players, public.events, public.progress from anon;
grant select, insert, update on public.players to authenticated;
grant select, insert on public.events to authenticated;
grant select, insert, update on public.progress to authenticated;

drop policy if exists "players: own row" on public.players;
create policy "players: own row" on public.players
  for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "events: read own" on public.events;
create policy "events: read own" on public.events
  for select to authenticated
  using (player_id = (select auth.uid()));

drop policy if exists "events: add own" on public.events;
create policy "events: add own" on public.events
  for insert to authenticated
  with check (player_id = (select auth.uid()));

drop policy if exists "progress: own rows" on public.progress;
create policy "progress: own rows" on public.progress
  for all to authenticated
  using (player_id = (select auth.uid()))
  with check (player_id = (select auth.uid()));
