-- =====================================================================
-- Thinking Spree — Consultant Suite
-- Supabase schema + Row Level Security
-- Run this in the Supabase SQL editor on a new project.
-- =====================================================================

-- ---------- INCUBATORS ----------
create table if not exists public.incubators (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  partner      text,
  location     text,
  cohort_size  int,
  start_date   date,
  notes        text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_incubators_user on public.incubators(user_id);

alter table public.incubators enable row level security;

drop policy if exists "incubators: select own" on public.incubators;
create policy "incubators: select own" on public.incubators
  for select using (auth.uid() = user_id);

drop policy if exists "incubators: insert own" on public.incubators;
create policy "incubators: insert own" on public.incubators
  for insert with check (auth.uid() = user_id);

drop policy if exists "incubators: update own" on public.incubators;
create policy "incubators: update own" on public.incubators
  for update using (auth.uid() = user_id);

drop policy if exists "incubators: delete own" on public.incubators;
create policy "incubators: delete own" on public.incubators
  for delete using (auth.uid() = user_id);


-- ---------- VENTURES ----------
create table if not exists public.ventures (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  sector        text,
  stage         text,
  incubator_id  uuid references public.incubators(id) on delete set null,
  founder_name  text,
  founder_email text,
  status        text not null default 'Active',
  created_at    timestamptz not null default now()
);

create index if not exists idx_ventures_user on public.ventures(user_id);
create index if not exists idx_ventures_incubator on public.ventures(incubator_id);

alter table public.ventures enable row level security;

drop policy if exists "ventures: select own" on public.ventures;
create policy "ventures: select own" on public.ventures
  for select using (auth.uid() = user_id);

drop policy if exists "ventures: insert own" on public.ventures;
create policy "ventures: insert own" on public.ventures
  for insert with check (auth.uid() = user_id);

drop policy if exists "ventures: update own" on public.ventures;
create policy "ventures: update own" on public.ventures
  for update using (auth.uid() = user_id);

drop policy if exists "ventures: delete own" on public.ventures;
create policy "ventures: delete own" on public.ventures
  for delete using (auth.uid() = user_id);


-- ---------- EMAIL DRAFTS ----------
create table if not exists public.email_drafts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  venture_id  uuid references public.ventures(id) on delete set null,
  kind        text not null check (kind in ('pre','post')),
  subject     text not null,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_email_drafts_user on public.email_drafts(user_id);

alter table public.email_drafts enable row level security;

drop policy if exists "email_drafts: select own" on public.email_drafts;
create policy "email_drafts: select own" on public.email_drafts
  for select using (auth.uid() = user_id);

drop policy if exists "email_drafts: insert own" on public.email_drafts;
create policy "email_drafts: insert own" on public.email_drafts
  for insert with check (auth.uid() = user_id);

drop policy if exists "email_drafts: update own" on public.email_drafts;
create policy "email_drafts: update own" on public.email_drafts
  for update using (auth.uid() = user_id);

drop policy if exists "email_drafts: delete own" on public.email_drafts;
create policy "email_drafts: delete own" on public.email_drafts
  for delete using (auth.uid() = user_id);
