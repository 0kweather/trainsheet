-- Trainsheet accounts: the tables a signed-in rider's data lives in, for a
-- Supabase project (README, "Accounts"). Run it once in the project's SQL
-- editor; it can be run again (every statement replaces what it makes).
--
-- Row-level security does the guarding: the page holds only the project's
-- public (anon) key, and every row can be read or written only by the
-- account it belongs to. Deleting an account deletes its rows.

-- ---------- Trips ----------
-- A rider's trains, planned and taken: entered by hand, or logged when a
-- tracked train reaches the stop it was tracked to.
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  agency text not null check (char_length(agency) between 1 and 40),   -- a railroad id in js/sources.js (AGENCIES)
  number text check (char_length(number) <= 20),                       -- the train's number
  route text check (char_length(route) <= 120),                        -- its line or name ("Northeast Regional")
  service_date date not null,                                          -- the day it leaves, in its own time zone
  from_name text check (char_length(from_name) <= 120),
  from_key text check (char_length(from_key) <= 80),                   -- stop key (js/stations.js stopKey), when known
  to_name text check (char_length(to_name) <= 120),
  to_key text check (char_length(to_key) <= 80),
  depart_at timestamptz,
  arrive_at timestamptz,
  status text not null default 'planned' check (status in ('planned', 'taken', 'cancelled')),
  source text not null default 'manual' check (source in ('manual', 'tracked')),
  -- A tracked ride's own key (train id and day), so two devices logging the
  -- same arrival make one row.
  ride_key text check (char_length(ride_key) <= 200),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, ride_key)
);
create index if not exists trips_user_date on public.trips (user_id, service_date desc);
-- A trip with connections: its trains are rows of their own, sharing one
-- journey id (null for a trip on one train). Added after the first version,
-- so it's added to a table made without it.
alter table public.trips add column if not exists journey uuid;
create index if not exists trips_user_journey on public.trips (user_id, journey) where journey is not null;

-- ---------- Tracked trains ----------
-- The trains a rider is tracking (js/app.js state.tracked), so every device
-- signed in to the account follows the same ones.
create table if not exists public.user_state (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  tracked jsonb not null default '[]'::jsonb
    check (jsonb_typeof(tracked) = 'array' and jsonb_array_length(tracked) <= 10 and pg_column_size(tracked) <= 8192),
  updated_at timestamptz not null default now()
);

-- updated_at kept by the database, so devices can tell which copy is newer.
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists trips_touch on public.trips;
create trigger trips_touch before update on public.trips for each row execute function public.touch_updated_at();
drop trigger if exists user_state_touch on public.user_state;
create trigger user_state_touch before insert or update on public.user_state for each row execute function public.touch_updated_at();

-- ---------- Row-level security ----------
-- Signed in: your own rows, and only those. Signed out: nothing.
alter table public.trips enable row level security;
alter table public.user_state enable row level security;

drop policy if exists "own trips" on public.trips;
create policy "own trips" on public.trips for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "own state" on public.user_state;
create policy "own state" on public.user_state for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.trips, public.user_state from anon;
grant select, insert, update, delete on public.trips, public.user_state to authenticated;

-- ---------- Deleting an account ----------
-- From Settings, by the rider themself: the login goes, and its trips and
-- tracked trains with it (on delete cascade). Facebook Login and the GDPR
-- both expect riders to be able to do this.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
