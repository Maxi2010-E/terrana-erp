-- Terrana ERP: HR payroll — leave, advances, bonuses, monthly payroll runs
-- Run in Supabase Dashboard → SQL Editor after prior migrations.

do $$ begin
  create type public.leave_type as enum ('paid', 'unpaid');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.hr_request_status as enum (
    'pending_approval',
    'approved',
    'rejected',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payroll_run_status as enum ('draft', 'finalized', 'paid');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Leave
-- ---------------------------------------------------------------------------
create table if not exists public.employee_leave (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  leave_type public.leave_type not null,
  start_date date not null,
  end_date date not null,
  reason text,
  status public.hr_request_status not null default 'pending_approval',
  approved_by uuid references public.users (id) on delete set null,
  approved_at timestamptz,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists employee_leave_employee_idx
  on public.employee_leave (employee_id, start_date desc);

create index if not exists employee_leave_period_idx
  on public.employee_leave (start_date, end_date)
  where status = 'approved';

drop trigger if exists employee_leave_updated_at on public.employee_leave;
create trigger employee_leave_updated_at
  before update on public.employee_leave
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Salary advances
-- ---------------------------------------------------------------------------
create table if not exists public.employee_advances (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  amount_repaid numeric(12, 2) not null default 0 check (amount_repaid >= 0),
  date_issued date not null default current_date,
  reason text,
  status public.hr_request_status not null default 'pending_approval',
  approved_by uuid references public.users (id) on delete set null,
  approved_at timestamptz,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (amount_repaid <= amount)
);

create index if not exists employee_advances_employee_idx
  on public.employee_advances (employee_id, date_issued desc);

create index if not exists employee_advances_outstanding_idx
  on public.employee_advances (employee_id)
  where status = 'approved' and amount_repaid < amount;

drop trigger if exists employee_advances_updated_at on public.employee_advances;
create trigger employee_advances_updated_at
  before update on public.employee_advances
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Bonuses
-- ---------------------------------------------------------------------------
create table if not exists public.employee_bonuses (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  pay_period date not null,
  reason text,
  status public.hr_request_status not null default 'pending_approval',
  approved_by uuid references public.users (id) on delete set null,
  approved_at timestamptz,
  payroll_line_id uuid,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employee_bonuses_employee_idx
  on public.employee_bonuses (employee_id, pay_period desc);

create index if not exists employee_bonuses_period_idx
  on public.employee_bonuses (pay_period)
  where status = 'approved';

drop trigger if exists employee_bonuses_updated_at on public.employee_bonuses;
create trigger employee_bonuses_updated_at
  before update on public.employee_bonuses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Payroll runs
-- ---------------------------------------------------------------------------
create table if not exists public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  pay_period date not null,
  status public.payroll_run_status not null default 'draft',
  notes text,
  finalized_by uuid references public.users (id) on delete set null,
  finalized_at timestamptz,
  paid_at timestamptz,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pay_period)
);

create index if not exists payroll_runs_status_idx
  on public.payroll_runs (status, pay_period desc);

drop trigger if exists payroll_runs_updated_at on public.payroll_runs;
create trigger payroll_runs_updated_at
  before update on public.payroll_runs
  for each row execute function public.set_updated_at();

create table if not exists public.payroll_lines (
  id uuid primary key default gen_random_uuid(),
  payroll_run_id uuid not null references public.payroll_runs (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete restrict,
  base_salary numeric(12, 2) not null,
  working_days_in_period integer not null,
  paid_leave_days integer not null default 0,
  unpaid_leave_days integer not null default 0,
  leave_deduction numeric(12, 2) not null default 0,
  bonus_total numeric(12, 2) not null default 0,
  advance_deduction numeric(12, 2) not null default 0,
  gross_pay numeric(12, 2) not null,
  net_pay numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  unique (payroll_run_id, employee_id)
);

create index if not exists payroll_lines_run_idx
  on public.payroll_lines (payroll_run_id);

alter table public.employee_bonuses
  drop constraint if exists employee_bonuses_payroll_line_id_fkey;

alter table public.employee_bonuses
  add constraint employee_bonuses_payroll_line_id_fkey
  foreign key (payroll_line_id) references public.payroll_lines (id) on delete set null;

create table if not exists public.payroll_advance_deductions (
  id uuid primary key default gen_random_uuid(),
  payroll_line_id uuid not null references public.payroll_lines (id) on delete cascade,
  advance_id uuid not null references public.employee_advances (id) on delete restrict,
  amount_deducted numeric(12, 2) not null check (amount_deducted > 0),
  created_at timestamptz not null default now(),
  unique (payroll_line_id, advance_id)
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.employee_leave enable row level security;
alter table public.employee_advances enable row level security;
alter table public.employee_bonuses enable row level security;
alter table public.payroll_runs enable row level security;
alter table public.payroll_lines enable row level security;
alter table public.payroll_advance_deductions enable row level security;

drop policy if exists employee_leave_select on public.employee_leave;
create policy employee_leave_select on public.employee_leave
  for select to authenticated
  using (public.current_app_role() in ('super_admin', 'admin', 'accounts'));

drop policy if exists employee_leave_insert on public.employee_leave;
create policy employee_leave_insert on public.employee_leave
  for insert to authenticated
  with check (public.current_app_role() in ('super_admin', 'admin', 'accounts'));

drop policy if exists employee_leave_update on public.employee_leave;
create policy employee_leave_update on public.employee_leave
  for update to authenticated
  using (public.current_app_role() in ('super_admin', 'admin'));

drop policy if exists employee_advances_select on public.employee_advances;
create policy employee_advances_select on public.employee_advances
  for select to authenticated
  using (public.current_app_role() in ('super_admin', 'admin', 'accounts'));

drop policy if exists employee_advances_insert on public.employee_advances;
create policy employee_advances_insert on public.employee_advances
  for insert to authenticated
  with check (public.current_app_role() in ('super_admin', 'admin', 'accounts'));

drop policy if exists employee_advances_update on public.employee_advances;
create policy employee_advances_update on public.employee_advances
  for update to authenticated
  using (public.current_app_role() in ('super_admin', 'admin'));

drop policy if exists employee_bonuses_select on public.employee_bonuses;
create policy employee_bonuses_select on public.employee_bonuses
  for select to authenticated
  using (public.current_app_role() in ('super_admin', 'admin', 'accounts'));

drop policy if exists employee_bonuses_insert on public.employee_bonuses;
create policy employee_bonuses_insert on public.employee_bonuses
  for insert to authenticated
  with check (public.current_app_role() in ('super_admin', 'admin', 'accounts'));

drop policy if exists employee_bonuses_update on public.employee_bonuses;
create policy employee_bonuses_update on public.employee_bonuses
  for update to authenticated
  using (public.current_app_role() in ('super_admin', 'admin'));

drop policy if exists payroll_runs_select on public.payroll_runs;
create policy payroll_runs_select on public.payroll_runs
  for select to authenticated
  using (public.current_app_role() in ('super_admin', 'admin', 'accounts'));

drop policy if exists payroll_runs_insert on public.payroll_runs;
create policy payroll_runs_insert on public.payroll_runs
  for insert to authenticated
  with check (public.current_app_role() in ('super_admin', 'admin', 'accounts'));

drop policy if exists payroll_runs_update on public.payroll_runs;
create policy payroll_runs_update on public.payroll_runs
  for update to authenticated
  using (public.current_app_role() in ('super_admin', 'admin', 'accounts'));

drop policy if exists payroll_lines_select on public.payroll_lines;
create policy payroll_lines_select on public.payroll_lines
  for select to authenticated
  using (public.current_app_role() in ('super_admin', 'admin', 'accounts'));

drop policy if exists payroll_lines_insert on public.payroll_lines;
create policy payroll_lines_insert on public.payroll_lines
  for insert to authenticated
  with check (public.current_app_role() in ('super_admin', 'admin', 'accounts'));

drop policy if exists payroll_lines_update on public.payroll_lines;
create policy payroll_lines_update on public.payroll_lines
  for update to authenticated
  using (public.current_app_role() in ('super_admin', 'admin', 'accounts'));

drop policy if exists payroll_advance_deductions_select on public.payroll_advance_deductions;
create policy payroll_advance_deductions_select on public.payroll_advance_deductions
  for select to authenticated
  using (public.current_app_role() in ('super_admin', 'admin', 'accounts'));

drop policy if exists payroll_advance_deductions_insert on public.payroll_advance_deductions;
create policy payroll_advance_deductions_insert on public.payroll_advance_deductions
  for insert to authenticated
  with check (public.current_app_role() in ('super_admin', 'admin', 'accounts'));
