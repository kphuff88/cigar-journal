-- ============================================================
-- Cigar Log — one-time database setup
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.
-- ============================================================

-- 1. Table that holds each person's cigars
create table if not exists public.cigars (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  brand       text default '',
  name        text default '',
  rating      int2 default 0,
  notes       text default '',
  band_path   text,
  cigar_path  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists cigars_user_idx on public.cigars(user_id);

-- 2. Turn on Row Level Security so each user only sees THEIR OWN cigars
alter table public.cigars enable row level security;

drop policy if exists "cigars_select_own" on public.cigars;
drop policy if exists "cigars_insert_own" on public.cigars;
drop policy if exists "cigars_update_own" on public.cigars;
drop policy if exists "cigars_delete_own" on public.cigars;

create policy "cigars_select_own" on public.cigars
  for select using (auth.uid() = user_id);
create policy "cigars_insert_own" on public.cigars
  for insert with check (auth.uid() = user_id);
create policy "cigars_update_own" on public.cigars
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cigars_delete_own" on public.cigars
  for delete using (auth.uid() = user_id);

-- 3. Private storage bucket for the band + cigar photos
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

-- 4. Storage security: a user can only touch files in a folder named after their own id
drop policy if exists "photos_select_own" on storage.objects;
drop policy if exists "photos_insert_own" on storage.objects;
drop policy if exists "photos_update_own" on storage.objects;
drop policy if exists "photos_delete_own" on storage.objects;

create policy "photos_select_own" on storage.objects
  for select using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos_insert_own" on storage.objects
  for insert with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos_update_own" on storage.objects
  for update using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos_delete_own" on storage.objects
  for delete using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Done. You should see "Success. No rows returned".
