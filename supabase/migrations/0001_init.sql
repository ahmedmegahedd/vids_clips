-- Clipora production schema
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free', 'creator', 'pro', 'business')),
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'queued',
  stage text not null default 'preparing',
  progress integer not null default 0,
  current_clip integer not null default 0,
  estimated_clips integer not null default 0,
  clip_seconds integer not null,
  format text not null,
  options jsonb not null default '{}',
  youtube_id text not null,
  source_url text not null,
  title text not null,
  channel_name text not null,
  thumbnail_url text not null,
  duration_seconds integer not null,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clips (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  index integer not null,
  start_seconds integer not null,
  end_seconds integer not null,
  duration_seconds integer not null,
  thumbnail_url text,
  video_url text,
  storage_path text
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  minutes numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id, created_at desc);
create index if not exists clips_project_id_idx on public.clips (project_id, index);
create index if not exists usage_user_id_idx on public.usage_events (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.clips enable row level security;
alter table public.usage_events enable row level security;

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users read own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users read own clips"
  on public.clips for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = clips.project_id and p.user_id = auth.uid()
    )
  );

create policy "Users read own usage"
  on public.usage_events for select
  using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('clips', 'clips', true)
on conflict (id) do nothing;
