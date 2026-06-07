-- Individual payroll lines — per-employee status and bonus award date

do $$ begin
  create type public.payroll_line_status as enum ('recorded', 'paid');
exception when duplicate_object then null; end $$;

alter table public.payroll_lines
  add column if not exists status public.payroll_line_status not null default 'recorded';

alter table public.payroll_lines
  add column if not exists paid_at timestamptz;

alter table public.employee_bonuses
  add column if not exists bonus_date date not null default current_date;

create index if not exists payroll_lines_status_idx
  on public.payroll_lines (payroll_run_id, status);
