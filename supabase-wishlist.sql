-- ============================================================
-- Cigar Log — Wish List setup
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.
-- ============================================================

create table if not exists public.wishlist (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  brand        text default '',
  name         text default '',
  note         text default '',
  target_price text default '',
  created_at   timestamptz default now()
);
create index if not exists wishlist_user_idx on public.wishlist(user_id, created_at desc);

alter table public.wishlist enable row level security;

-- Each person can see and change only their own wish list.
drop policy if exists "wishlist_rw_own" on public.wishlist;
create policy "wishlist_rw_own" on public.wishlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on table public.wishlist to authenticated;

-- Done. You should see "Success. No rows returned".
