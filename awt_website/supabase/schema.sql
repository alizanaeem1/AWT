create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'student' check (role in ('student', 'admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists email text;

create table if not exists public.lectures (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text,
  order_number integer not null default 0,
  short_description text,
  english_content text,
  roman_urdu_content text,
  code_examples text,
  notes text,
  resources jsonb not null default '[]'::jsonb,
  content_blocks jsonb not null default '[]'::jsonb,
  thumbnail_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lectures
  add column if not exists content_blocks jsonb not null default '[]'::jsonb;

create table if not exists public.custom_components (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  block_type text not null,
  block_template jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.labs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  lab_number integer not null unique,
  objective text,
  required_tools jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  code_examples text,
  output_preview text,
  common_errors jsonb not null default '[]'::jsonb,
  tips jsonb not null default '[]'::jsonb,
  content_blocks jsonb not null default '[]'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.labs
  add column if not exists content_blocks jsonb not null default '[]'::jsonb;

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  type text not null default 'Activity',
  description text,
  deadline timestamptz,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  content_type text not null check (content_type in ('lecture', 'lab', 'activity')),
  content_id text not null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  percent integer not null default 0 check (percent >= 0 and percent <= 100),
  metadata jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (profile_id, content_type, content_id)
);

alter table public.progress
  alter column content_id type text using content_id::text;

alter table public.progress
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  website_title text not null default 'AWT Interactive Learning Platform',
  logo_url text,
  primary_color text not null default '#34d399',
  secondary_color text not null default '#22d3ee',
  default_theme text not null default 'dark' check (default_theme in ('dark', 'light')),
  language_default text not null default 'en' check (language_default in ('en', 'roman-urdu')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_files (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_url text not null,
  file_type text,
  bucket text not null default 'media',
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create index if not exists lectures_published_order_idx on public.lectures (is_published, order_number);
create index if not exists labs_published_number_idx on public.labs (is_published, lab_number);
create index if not exists activities_published_created_idx on public.activities (is_published, created_at);
create index if not exists progress_profile_idx on public.progress (profile_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email, 'student')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = user_id and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.lectures enable row level security;
alter table public.labs enable row level security;
alter table public.activities enable row level security;
alter table public.progress enable row level security;
alter table public.site_settings enable row level security;
alter table public.media_files enable row level security;
alter table public.custom_components enable row level security;

drop policy if exists "Lectures are readable" on public.lectures;
drop policy if exists "Published lectures or admins can read" on public.lectures;
drop policy if exists "Lectures are editable" on public.lectures;
drop policy if exists "Labs are readable" on public.labs;
drop policy if exists "Published labs or admins can read" on public.labs;
drop policy if exists "Labs are editable" on public.labs;
drop policy if exists "Activities are readable" on public.activities;
drop policy if exists "Published activities or admins can read" on public.activities;
drop policy if exists "Activities are editable" on public.activities;
drop policy if exists "Site settings are readable" on public.site_settings;
drop policy if exists "Site settings are editable by admins" on public.site_settings;
drop policy if exists "Media files are readable" on public.media_files;
drop policy if exists "Media files are editable by admins" on public.media_files;
drop policy if exists "Custom components are readable" on public.custom_components;
drop policy if exists "Custom components are editable by admins" on public.custom_components;
drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Users can insert their own student profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can read their own progress" on public.progress;
drop policy if exists "Users can manage their own progress" on public.progress;

create policy "Published lectures or admins can read"
  on public.lectures for select
  using (
    is_published = true
    or public.is_admin(auth.uid())
  );

create policy "Lectures are editable"
  on public.lectures for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Published labs or admins can read"
  on public.labs for select
  using (
    is_published = true
    or public.is_admin(auth.uid())
  );

create policy "Labs are editable"
  on public.labs for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Published activities or admins can read"
  on public.activities for select
  using (
    is_published = true
    or public.is_admin(auth.uid())
  );

create policy "Activities are editable"
  on public.activities for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Site settings are readable"
  on public.site_settings for select
  using (true);

create policy "Site settings are editable by admins"
  on public.site_settings for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Media files are readable"
  on public.media_files for select
  using (true);

create policy "Media files are editable by admins"
  on public.media_files for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Custom components are readable"
  on public.custom_components for select
  using (true);

create policy "Custom components are editable by admins"
  on public.custom_components for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin(auth.uid()));

create policy "Users can insert their own student profile"
  on public.profiles for insert
  with check (
    auth.uid() = id 
    and (
      role = 'student' 
      or (auth.jwt() ->> 'email' = 'alizanaeem37@gmail.com')
    )
  );

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id 
    and (
      role = 'student' 
      or (auth.jwt() ->> 'email' = 'alizanaeem37@gmail.com')
      or public.is_admin(auth.uid())
    )
  );

create policy "Users can read their own progress"
  on public.progress for select
  using (auth.uid() = profile_id);

create policy "Users can manage their own progress"
  on public.progress for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Media bucket objects are readable" on storage.objects;
drop policy if exists "Media bucket objects are insertable" on storage.objects;
drop policy if exists "Media bucket objects are editable" on storage.objects;
drop policy if exists "Media bucket objects are deletable" on storage.objects;
drop policy if exists "Avatars are uploadable by owner" on storage.objects;
drop policy if exists "Avatars are updatable by owner" on storage.objects;
drop policy if exists "Avatars are deletable by owner" on storage.objects;

-- Anyone can read media files (public bucket)
create policy "Media bucket objects are readable"
  on storage.objects for select
  using (bucket_id = 'media');

-- Admins can insert any media file
create policy "Media bucket objects are insertable"
  on storage.objects for insert
  with check (
    bucket_id = 'media'
    and public.is_admin(auth.uid())
  );

-- Authenticated users can upload their own avatar (avatars/ prefix)
create policy "Avatars are uploadable by owner"
  on storage.objects for insert
  with check (
    bucket_id = 'media'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = 'avatars'
  );

-- Admins can update any media file
create policy "Media bucket objects are editable"
  on storage.objects for update
  using (
    bucket_id = 'media'
    and public.is_admin(auth.uid())
  )
  with check (
    bucket_id = 'media'
    and public.is_admin(auth.uid())
  );

-- Authenticated users can update their own avatar
create policy "Avatars are updatable by owner"
  on storage.objects for update
  using (
    bucket_id = 'media'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = 'avatars'
  )
  with check (
    bucket_id = 'media'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = 'avatars'
  );

-- Admins can delete any media file
create policy "Media bucket objects are deletable"
  on storage.objects for delete
  using (
    bucket_id = 'media'
    and public.is_admin(auth.uid())
  );

-- Authenticated users can delete their own avatar
create policy "Avatars are deletable by owner"
  on storage.objects for delete
  using (
    bucket_id = 'media'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = 'avatars'
  );

-- ============================================================
-- SITE SETTINGS TABLE
-- ============================================================
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  website_title text not null default 'AWT Interactive Learning Platform',
  logo_url text,
  primary_color text not null default '#34d399',
  secondary_color text not null default '#22d3ee',
  default_theme text not null default 'dark' check (default_theme in ('dark', 'light')),
  language_default text not null default 'en' check (language_default in ('en', 'roman-urdu')),
  updated_at timestamptz not null default now()
);

-- RLS for site_settings
alter table public.site_settings enable row level security;

-- Everyone can read settings (needed for public site branding)
-- Drop existing policies first to avoid "already exists" errors
drop policy if exists "Site settings are publicly readable" on public.site_settings;
drop policy if exists "Admins can insert site settings" on public.site_settings;
drop policy if exists "Admins can update site settings" on public.site_settings;

-- Everyone can read settings (needed for public site branding)
create policy "Site settings are publicly readable"
  on public.site_settings for select
  using (true);

-- Only admins can insert/update site settings
create policy "Admins can insert site settings"
  on public.site_settings for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update site settings"
  on public.site_settings for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
