-- Terrana ERP Phase 1: employees, users link, attendance
-- Run in Supabase Dashboard → SQL Editor after 00001_phase0_foundation.sql

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.employee_status as enum (
    'active',
    'inactive',
    'on_leave',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.employee_department as enum (
    'administration',
    'accounts',
    'inventory',
    'logistics',
    'processing',
    'packaging'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.employee_type as enum (
    'administrative',
    'field_staff'
  );
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Employees
-- ---------------------------------------------------------------------------
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_code text not null unique,
  first_name text not null,
  last_name text not null,
  phone text,
  email text,
  address text,
  hire_date date not null default current_date,
  status public.employee_status not null default 'active',
  employee_type public.employee_type not null default 'administrative',
  department public.employee_department not null default 'administration',
  job_title text not null,
  monthly_salary numeric(12, 2) not null default 0,
  guarantor_name text,
  guarantor_phone text,
  guarantor_address text,
  cv_url text,
  employment_letter_url text,
  id_document_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employees_status_idx on public.employees (status);
create index if not exists employees_department_idx on public.employees (department);
create index if not exists employees_hire_date_idx on public.employees (hire_date desc);
create index if not exists employees_name_idx on public.employees (last_name, first_name);

drop trigger if exists employees_updated_at on public.employees;
create trigger employees_updated_at
  before update on public.employees
  for each row execute function public.set_updated_at();

create or replace function public.generate_employee_code()
returns text
language plpgsql
as $$
declare
  year_part text := to_char(current_date, 'YYYY');
  next_num integer;
begin
  select coalesce(
    max(
      nullif(
        regexp_replace(employee_code, '^EMP-' || year_part || '-', ''),
        employee_code
      )::integer
    ),
    0
  ) + 1
  into next_num
  from public.employees
  where employee_code like 'EMP-' || year_part || '-%';

  return 'EMP-' || year_part || '-' || lpad(next_num::text, 5, '0');
end;
$$;

-- Link users.employee_id → employees
alter table public.users
  drop constraint if exists users_employee_id_fkey;

alter table public.users
  add constraint users_employee_id_fkey
  foreign key (employee_id) references public.employees (id) on delete set null;

create index if not exists users_employee_id_idx on public.users (employee_id);

-- Disable linked user when employee is inactive or archived
create or replace function public.sync_user_on_employee_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('inactive', 'archived') then
    update public.users
    set status = 'disabled', updated_at = now()
    where employee_id = new.id
      and status <> 'disabled';
  end if;
  return new;
end;
$$;

drop trigger if exists employee_status_sync_user on public.employees;
create trigger employee_status_sync_user
  after update of status on public.employees
  for each row
  when (old.status is distinct from new.status)
  execute function public.sync_user_on_employee_status();

-- ---------------------------------------------------------------------------
-- Attendance
-- ---------------------------------------------------------------------------
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  login_time timestamptz not null default now(),
  logout_time timestamptz,
  attendance_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists attendance_user_date_idx
  on public.attendance (user_id, attendance_date desc);

create index if not exists attendance_open_session_idx
  on public.attendance (user_id)
  where logout_time is null;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.employees enable row level security;
alter table public.attendance enable row level security;

drop policy if exists employees_select on public.employees;
create policy employees_select on public.employees
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts')
    or id = (select employee_id from public.users where id = auth.uid())
  );

drop policy if exists employees_insert on public.employees;
create policy employees_insert on public.employees
  for insert to authenticated
  with check (public.current_app_role() in ('super_admin', 'admin'));

drop policy if exists employees_update on public.employees;
create policy employees_update on public.employees
  for update to authenticated
  using (public.current_app_role() in ('super_admin', 'admin'));

drop policy if exists attendance_select on public.attendance;
create policy attendance_select on public.attendance
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.current_app_role() in ('super_admin', 'admin')
  );

drop policy if exists attendance_insert on public.attendance;
create policy attendance_insert on public.attendance
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists attendance_update on public.attendance;
create policy attendance_update on public.attendance
  for update to authenticated
  using (
    user_id = auth.uid()
    or public.current_app_role() in ('super_admin', 'admin')
  );

drop policy if exists users_insert_admin on public.users;
create policy users_insert_admin on public.users
  for insert to authenticated
  with check (public.current_app_role() in ('super_admin', 'admin'));

grant execute on function public.generate_employee_code() to authenticated;
