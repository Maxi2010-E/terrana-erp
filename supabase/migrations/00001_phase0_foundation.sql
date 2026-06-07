-- Terrana ERP Phase 0: database conventions and foundation
-- Run in Supabase Dashboard → SQL Editor → New query → Run

-- ---------------------------------------------------------------------------
-- Extensions & enums
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

do $$ begin
  create type public.app_role as enum (
    'super_admin',
    'admin',
    'accounts',
    'inventory_manager',
    'logistics_manager'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.record_status as enum (
    'active',
    'inactive',
    'archived',
    'disabled'
  );
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Shared trigger: updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Company settings (single row for v1)
-- ---------------------------------------------------------------------------
create table if not exists public.company_settings (
  id uuid primary key default gen_random_uuid(),
  company_name text not null default 'Terrana Africa Limited',
  currency_code text not null default 'NGN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists company_settings_updated_at on public.company_settings;
create trigger company_settings_updated_at
  before update on public.company_settings
  for each row execute function public.set_updated_at();

insert into public.company_settings (company_name, currency_code)
select 'Terrana Africa Limited', 'NGN'
where not exists (select 1 from public.company_settings);

-- ---------------------------------------------------------------------------
-- App users (linked to Supabase Auth)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  username text unique,
  role public.app_role not null default 'accounts',
  status public.record_status not null default 'active',
  employee_id uuid,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_role_idx on public.users (role);
create index if not exists users_status_idx on public.users (status);

drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- First registered user becomes super_admin; others default to accounts
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role public.app_role;
begin
  if exists (select 1 from public.users) then
    assigned_role := 'accounts';
  else
    assigned_role := 'super_admin';
  end if;

  insert into public.users (id, email, role, status)
  values (new.id, coalesce(new.email, ''), assigned_role, 'active')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_read_idx
  on public.notifications (user_id, read_at);

-- ---------------------------------------------------------------------------
-- Row Level Security (simple role-based skeleton)
-- ---------------------------------------------------------------------------
alter table public.company_settings enable row level security;
alter table public.users enable row level security;
alter table public.notifications enable row level security;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

-- Company settings: all authenticated users can read
drop policy if exists company_settings_select on public.company_settings;
create policy company_settings_select on public.company_settings
  for select to authenticated using (true);

drop policy if exists company_settings_update on public.company_settings;
create policy company_settings_update on public.company_settings
  for update to authenticated
  using (public.current_app_role() in ('super_admin', 'admin'));

-- Users: read own row; admins read all
drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
  for select to authenticated
  using (
    id = auth.uid()
    or public.current_app_role() in ('super_admin', 'admin')
  );

drop policy if exists users_update_admin on public.users;
create policy users_update_admin on public.users
  for update to authenticated
  using (public.current_app_role() in ('super_admin', 'admin'));

-- Notifications: users see their own
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (user_id = auth.uid());
