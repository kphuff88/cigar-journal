-- ============================================================
-- Cigar Log — SHARED cigar shops directory (one-time setup)
-- Paste into Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.
-- ============================================================

create table if not exists public.shops (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text default '',
  city        text default '',
  notes       text default '',
  lat         double precision,
  lng         double precision,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);

-- Let logged-in users read and add shops through the API
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.shops to authenticated;

alter table public.shops enable row level security;

drop policy if exists "shops_select_all" on public.shops;
drop policy if exists "shops_insert_auth" on public.shops;
drop policy if exists "shops_update_own" on public.shops;
drop policy if exists "shops_delete_own" on public.shops;

-- Everyone signed in can see every shop (shared directory)
create policy "shops_select_all" on public.shops
  for select using (true);

-- Any signed-in user can add a shop (stamped with their id)
create policy "shops_insert_auth" on public.shops
  for insert with check (auth.uid() = created_by);

-- Only the person who added a shop can edit or delete it
create policy "shops_update_own" on public.shops
  for update using (auth.uid() = created_by) with check (auth.uid() = created_by);
create policy "shops_delete_own" on public.shops
  for delete using (auth.uid() = created_by);

-- Done. You should see "Success. No rows returned".
