-- Terrana ERP Phase 7: daily expenses, operational expenses, petty cash
-- Run in Supabase Dashboard → SQL Editor after 00025_employee_photo.sql

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.daily_expense_category as enum (
    'utilities',
    'repairs',
    'maintenance',
    'office_supplies',
    'others'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.operational_expense_type as enum (
    'cleaning',
    'grading',
    'field_transfer_out',
    'field_transfer_in',
    'truck_offloading',
    'warehouse_loading',
    'miscellaneous'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.expense_record_status as enum (
    'pending_approval',
    'approved'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Petty cash top-ups
-- ---------------------------------------------------------------------------
create table if not exists public.petty_cash_top_ups (
  id uuid primary key default gen_random_uuid(),
  amount_added numeric(14, 2) not null check (amount_added > 0),
  date_added date not null default current_date,
  added_by uuid references public.users (id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists petty_cash_top_ups_date_idx
  on public.petty_cash_top_ups (date_added desc);

drop trigger if exists petty_cash_top_ups_updated_at on public.petty_cash_top_ups;
create trigger petty_cash_top_ups_updated_at
  before update on public.petty_cash_top_ups
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Daily expenses
-- ---------------------------------------------------------------------------
create table if not exists public.daily_expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null default current_date,
  expense_category public.daily_expense_category not null,
  description text not null,
  amount numeric(14, 2) not null check (amount > 0),
  payment_method public.supplier_payment_method not null,
  receipt_url text,
  notes text,
  entered_by uuid references public.users (id),
  status public.expense_record_status not null default 'pending_approval',
  approved_by uuid references public.users (id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists daily_expenses_date_idx
  on public.daily_expenses (expense_date desc);

create index if not exists daily_expenses_status_idx
  on public.daily_expenses (status);

create index if not exists daily_expenses_pending_idx
  on public.daily_expenses (status)
  where status = 'pending_approval';

drop trigger if exists daily_expenses_updated_at on public.daily_expenses;
create trigger daily_expenses_updated_at
  before update on public.daily_expenses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Operational expenses
-- ---------------------------------------------------------------------------
create table if not exists public.operational_expenses (
  id uuid primary key default gen_random_uuid(),
  expense_type public.operational_expense_type not null,
  processing_session_id uuid references public.processing_sessions (id),
  inventory_batch_id uuid references public.inventory_batches (id),
  procurement_batch_id uuid references public.procurement_batches (id),
  pre_stock_id uuid references public.pre_stock (id),
  shipment_id uuid,
  bags integer not null check (bags > 0),
  rate_per_bag numeric(14, 2) not null check (rate_per_bag >= 0),
  total_amount numeric(14, 2) not null check (total_amount > 0),
  payment_method public.supplier_payment_method not null,
  notes text,
  paid_by uuid references public.users (id),
  expense_date date not null default current_date,
  status public.expense_record_status not null default 'pending_approval',
  approved_by uuid references public.users (id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint operational_expenses_total_check
    check (total_amount = round(bags * rate_per_bag, 2)),
  constraint operational_expenses_link_check check (
    (
      expense_type in ('cleaning', 'field_transfer_out')
      and processing_session_id is not null
      and inventory_batch_id is null
      and procurement_batch_id is null
      and pre_stock_id is null
      and shipment_id is null
    )
    or (
      expense_type = 'grading'
      and inventory_batch_id is not null
      and processing_session_id is null
      and procurement_batch_id is null
      and pre_stock_id is null
      and shipment_id is null
    )
    or (
      expense_type = 'truck_offloading'
      and procurement_batch_id is not null
      and processing_session_id is null
      and inventory_batch_id is null
      and pre_stock_id is null
      and shipment_id is null
    )
    or (
      expense_type = 'field_transfer_in'
      and pre_stock_id is not null
      and processing_session_id is null
      and inventory_batch_id is null
      and procurement_batch_id is null
      and shipment_id is null
    )
    or (
      expense_type = 'warehouse_loading'
      and shipment_id is not null
      and processing_session_id is null
      and inventory_batch_id is null
      and procurement_batch_id is null
      and pre_stock_id is null
    )
    or (
      expense_type = 'miscellaneous'
      and processing_session_id is null
      and inventory_batch_id is null
      and procurement_batch_id is null
      and pre_stock_id is null
      and shipment_id is null
    )
  )
);

create index if not exists operational_expenses_type_idx
  on public.operational_expenses (expense_type);

create index if not exists operational_expenses_date_idx
  on public.operational_expenses (expense_date desc);

create index if not exists operational_expenses_status_idx
  on public.operational_expenses (status);

create index if not exists operational_expenses_pending_idx
  on public.operational_expenses (status)
  where status = 'pending_approval';

drop trigger if exists operational_expenses_updated_at on public.operational_expenses;
create trigger operational_expenses_updated_at
  before update on public.operational_expenses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Petty cash balance
-- ---------------------------------------------------------------------------
create or replace function public.get_petty_cash_balance()
returns numeric(14, 2)
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select sum(amount_added) from public.petty_cash_top_ups),
    0
  ) - coalesce(
    (
      select sum(amount)
      from public.daily_expenses
      where payment_method = 'cash'
        and status = 'approved'
    ),
    0
  ) - coalesce(
    (
      select sum(total_amount)
      from public.operational_expenses
      where payment_method = 'cash'
        and status = 'approved'
    ),
    0
  );
$$;

grant execute on function public.get_petty_cash_balance() to authenticated;

create or replace function public.validate_daily_expense_petty_cash()
returns trigger
language plpgsql
as $$
declare
  current_balance numeric(14, 2);
begin
  if new.status = 'approved' and new.payment_method = 'cash' then
    select public.get_petty_cash_balance() into current_balance;

    if tg_op = 'UPDATE'
      and old.status = 'approved'
      and old.payment_method = 'cash'
      and old.id = new.id then
      current_balance := current_balance + old.amount;
    end if;

    if new.amount > current_balance then
      raise exception 'Expense amount exceeds petty cash balance';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists daily_expenses_validate_petty_cash on public.daily_expenses;
create trigger daily_expenses_validate_petty_cash
  before insert or update of amount, status, payment_method
  on public.daily_expenses
  for each row execute function public.validate_daily_expense_petty_cash();

create or replace function public.validate_operational_expense_petty_cash()
returns trigger
language plpgsql
as $$
declare
  current_balance numeric(14, 2);
begin
  if new.status = 'approved' and new.payment_method = 'cash' then
    select public.get_petty_cash_balance() into current_balance;

    if tg_op = 'UPDATE'
      and old.status = 'approved'
      and old.payment_method = 'cash'
      and old.id = new.id then
      current_balance := current_balance + old.total_amount;
    end if;

    if new.total_amount > current_balance then
      raise exception 'Expense amount exceeds petty cash balance';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists operational_expenses_validate_petty_cash on public.operational_expenses;
create trigger operational_expenses_validate_petty_cash
  before insert or update of total_amount, status, payment_method
  on public.operational_expenses
  for each row execute function public.validate_operational_expense_petty_cash();

create or replace function public.validate_operational_expense_links()
returns trigger
language plpgsql
as $$
declare
  batch_type public.procurement_type;
begin
  if new.expense_type = 'truck_offloading' and new.procurement_batch_id is not null then
    select procurement_type
    into batch_type
    from public.procurement_batches
    where id = new.procurement_batch_id;

    if batch_type is distinct from 'off_site' then
      raise exception 'Truck offloading must link to an off-site procurement batch';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists operational_expenses_validate_links on public.operational_expenses;
create trigger operational_expenses_validate_links
  before insert or update of expense_type, procurement_batch_id
  on public.operational_expenses
  for each row execute function public.validate_operational_expense_links();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.petty_cash_top_ups enable row level security;
alter table public.daily_expenses enable row level security;
alter table public.operational_expenses enable row level security;

drop policy if exists petty_cash_top_ups_select on public.petty_cash_top_ups;
create policy petty_cash_top_ups_select on public.petty_cash_top_ups
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts')
  );

drop policy if exists petty_cash_top_ups_insert on public.petty_cash_top_ups;
create policy petty_cash_top_ups_insert on public.petty_cash_top_ups
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin')
  );

drop policy if exists daily_expenses_select on public.daily_expenses;
create policy daily_expenses_select on public.daily_expenses
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts')
  );

drop policy if exists daily_expenses_insert on public.daily_expenses;
create policy daily_expenses_insert on public.daily_expenses
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin', 'accounts')
  );

drop policy if exists daily_expenses_update on public.daily_expenses;
create policy daily_expenses_update on public.daily_expenses
  for update to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts')
  );

drop policy if exists operational_expenses_select on public.operational_expenses;
create policy operational_expenses_select on public.operational_expenses
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts')
  );

drop policy if exists operational_expenses_insert on public.operational_expenses;
create policy operational_expenses_insert on public.operational_expenses
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin', 'accounts')
  );

drop policy if exists operational_expenses_update on public.operational_expenses;
create policy operational_expenses_update on public.operational_expenses
  for update to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts')
  );

grant select, insert, update on public.petty_cash_top_ups to authenticated;
grant select, insert, update on public.daily_expenses to authenticated;
grant select, insert, update on public.operational_expenses to authenticated;
