-- Forma: Supabase schema
-- Run this in Supabase SQL Editor (supabase.com → SQL Editor → New Query)

-- ── Profiles ─────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  device_id text unique not null,
  name text not null default 'Друг',
  created_at timestamptz default now()
);

-- ── Forms (habit definitions) ────────────────────────────
create table if not exists forms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  principle text default '',
  type text not null check (type in ('time','duration','meal','boolean','limit','chain')),
  cat text default 'body',
  pts int default 50,
  config jsonb default '{}',
  streak int default 0,
  sort_order int default 0,
  visible text default 'all',
  tg_remind text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── Checkins (daily records) ─────────────────────────────
create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  form_id uuid references forms(id) on delete cascade not null,
  date date not null default current_date,
  score int default 0,
  data jsonb default '{}',
  created_at timestamptz default now(),
  unique(form_id, date)
);

-- ── Challenges (experiments) ─────────────────────────────
create table if not exists challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  preset_id text,
  name text not null,
  icon text default '✦',
  color text default '#9333EA',
  days int not null default 3,
  days_done jsonb default '[]',
  friends jsonb default '[]',
  started_at timestamptz default now(),
  active boolean default true
);

-- ── Indexes ──────────────────────────────────────────────
create index if not exists idx_forms_user on forms(user_id);
create index if not exists idx_checkins_user_date on checkins(user_id, date);
create index if not exists idx_checkins_form_date on checkins(form_id, date);
create index if not exists idx_challenges_user on challenges(user_id);

-- ── RLS (Row Level Security) ─────────────────────────────
-- For now, open access (anon key). Add auth later.
alter table profiles enable row level security;
alter table forms enable row level security;
alter table checkins enable row level security;
alter table challenges enable row level security;

create policy "public_profiles" on profiles for all using (true) with check (true);
create policy "public_forms" on forms for all using (true) with check (true);
create policy "public_checkins" on checkins for all using (true) with check (true);
create policy "public_challenges" on challenges for all using (true) with check (true);
