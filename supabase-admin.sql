-- ============================================================
-- Cigar Log — Admin setup (dropdown lists + free-access flags)
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.
-- ============================================================

-- 1. Dropdown option lists (shared; the Admin screen edits these)
create table if not exists public.app_options (
  id         uuid primary key default gen_random_uuid(),
  category   text not null check (category in ('origin','wrapper','binder','filler')),
  value      text not null,
  sort_order int2 default 0,
  created_at timestamptz default now()
);
create index if not exists app_options_cat_idx on public.app_options(category, sort_order);

alter table public.app_options enable row level security;
drop policy if exists "app_options_read" on public.app_options;
create policy "app_options_read" on public.app_options
  for select using (auth.role() = 'authenticated');
grant select on table public.app_options to authenticated;
grant select, insert, update, delete on table public.app_options to service_role;
-- (Adds/removes happen only through the admin Edge Function, using the
--  service role — so regular users can read the lists but never change them.)

-- 2. Free / comped access, granted by the admin
create table if not exists public.comps (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  comped     boolean default true,
  note       text default '',
  updated_at timestamptz default now()
);
alter table public.comps enable row level security;
drop policy if exists "comps_read_own" on public.comps;
create policy "comps_read_own" on public.comps
  for select using (auth.uid() = user_id);
grant select on table public.comps to authenticated;
grant select, insert, update, delete on table public.comps to service_role;
-- (Only the admin Edge Function writes here.)

-- The admin Edge Function (service_role) also reads these existing tables:
grant select, insert, update, delete on table public.shops  to service_role;
grant select, insert, update, delete on table public.cigars to service_role;

-- 3. Seed the dropdown lists with the current defaults (only if empty)
insert into public.app_options (category, value, sort_order)
select v.category, v.value, v.sort_order from (values
  ('origin','Cameroon',1),('origin','Cuba',2),('origin','Dominican',3),('origin','Ecuador',4),
  ('origin','Honduras',5),('origin','Indonesia',6),('origin','Mexico',7),('origin','Nicaragua',8),('origin','US',9),
  ('wrapper','Connecticut Shade',1),('wrapper','Connecticut Broadleaf',2),('wrapper','Habano',3),('wrapper','Corojo',4),
  ('wrapper','Cameroon',5),('wrapper','Sumatra',6),('wrapper','San Andrés',7),('wrapper','Criollo',8),
  ('wrapper','Brazilian',9),('wrapper','PA Broadleaf',10),
  ('binder','Connecticut Shade',1),('binder','Connecticut Broadleaf',2),('binder','Habano',3),('binder','Corojo',4),
  ('binder','Cameroon',5),('binder','Sumatra',6),('binder','San Andrés',7),('binder','Criollo',8),
  ('binder','Brazilian',9),('binder','PA Broadleaf',10),
  ('filler','Ligero',1),('filler','Seco',2),('filler','Viso',3),('filler','Nicaragua',4),
  ('filler','Dominican',5),('filler','Honduras',6),('filler','Mexican',7),('filler','Pennsylvania',8)
) as v(category,value,sort_order)
where not exists (select 1 from public.app_options);

-- Done. You should see "Success. No rows returned" (or a count on first run).
