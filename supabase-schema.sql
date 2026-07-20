-- QuickSnippet - Supabase Schema
-- Run this in your Supabase SQL Editor

-- 1. Snippets table
create table if not exists public.snippets (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null default 'General',
  content text not null,
  color text not null default 'indigo',
  workspace text not null default 'General',
  pinned boolean not null default false,
  folder text default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Indexes for performance
create index if not exists idx_snippets_user_id on public.snippets(user_id);
create index if not exists idx_snippets_workspace on public.snippets(workspace);
create index if not exists idx_snippets_updated_at on public.snippets(updated_at desc);

-- 3. Enable Row Level Security
alter table public.snippets enable row level security;

-- 4. RLS Policies: users can only see/edit their own snippets

-- Select: users can only read their own snippets
create policy "Users can read own snippets"
  on public.snippets
  for select
  using (auth.uid() = user_id);

-- Insert: users can create snippets with their own user_id
create policy "Users can create own snippets"
  on public.snippets
  for insert
  with check (auth.uid() = user_id);

-- Update: users can update their own snippets
create policy "Users can update own snippets"
  on public.snippets
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Delete: users can delete their own snippets
create policy "Users can delete own snippets"
  on public.snippets
  for delete
  using (auth.uid() = user_id);

-- 5. Auto-update updated_at on row modification
create extension if not exists moddatetime;

create trigger handle_snippets_updated_at
  before update on public.snippets
  for each row
  execute function moddatetime(updated_at);

-- 6. User Settings table (workspaces, folders, workspaceColors, workspaceThemes, categoriesOrder, categoryIcons)
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- RLS for user_settings
alter table public.user_settings enable row level security;

create policy "Users can read own settings"
  on public.user_settings
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.user_settings
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.user_settings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger handle_user_settings_updated_at
  before update on public.user_settings
  for each row
  execute function moddatetime(updated_at);

