-- Terrana ERP Phase 2: suppliers + bank accounts
-- Run in Supabase Dashboard → SQL Editor after 00005_users_last_login_only.sql

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.supplier_status as enum ('active', 'inactive');
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Suppliers
-- ---------------------------------------------------------------------------
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  supplier_code text not null unique,
  supplier_name text not null,
  phone text,
  email text,
  address text,
  status public.supplier_status not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists suppliers_status_idx on public.suppliers (status);
create index if not exists suppliers_name_idx on public.suppliers (supplier_name);
create index if not exists suppliers_code_idx on public.suppliers (supplier_code);

drop trigger if exists suppliers_updated_at on public.suppliers;
create trigger suppliers_updated_at
  before update on public.suppliers
  for each row execute function public.set_updated_at();

create or replace function public.generate_supplier_code()
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
        regexp_replace(supplier_code, '^SUP-' || year_part || '-', ''),
        supplier_code
      )::integer
    ),
    0
  ) + 1
  into next_num
  from public.suppliers
  where supplier_code like 'SUP-' || year_part || '-%';

  return 'SUP-' || year_part || '-' || lpad(next_num::text, 5, '0');
end;
$$;

grant execute on function public.generate_supplier_code() to authenticated;

create or replace function public.set_supplier_code()
returns trigger
language plpgsql
as $$
begin
  if new.supplier_code is null or new.supplier_code = '' then
    new.supplier_code := public.generate_supplier_code();
  end if;
  return new;
end;
$$;

drop trigger if exists suppliers_set_code on public.suppliers;
create trigger suppliers_set_code
  before insert on public.suppliers
  for each row execute function public.set_supplier_code();

-- Stub for Phase 3: auto-inactivate suppliers with no procurement in 90 days
create or replace function public.sync_supplier_inactivity()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Wired when procurement_batches exists (Phase 3)
  null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Supplier bank accounts
-- ---------------------------------------------------------------------------
create table if not exists public.supplier_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  bank_name text not null,
  account_number text not null,
  account_name text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supplier_bank_accounts_account_number_unique unique (account_number)
);

create index if not exists supplier_bank_accounts_supplier_idx
  on public.supplier_bank_accounts (supplier_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.suppliers enable row level security;
alter table public.supplier_bank_accounts enable row level security;

drop policy if exists suppliers_select on public.suppliers;
create policy suppliers_select on public.suppliers
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts')
  );

drop policy if exists suppliers_insert on public.suppliers;
create policy suppliers_insert on public.suppliers
  for insert to authenticated
  with check (public.current_app_role() in ('super_admin', 'admin'));

drop policy if exists suppliers_update on public.suppliers;
create policy suppliers_update on public.suppliers
  for update to authenticated
  using (public.current_app_role() in ('super_admin', 'admin'));

drop policy if exists supplier_bank_accounts_select on public.supplier_bank_accounts;
create policy supplier_bank_accounts_select on public.supplier_bank_accounts
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts')
  );

drop policy if exists supplier_bank_accounts_insert on public.supplier_bank_accounts;
create policy supplier_bank_accounts_insert on public.supplier_bank_accounts
  for insert to authenticated
  with check (public.current_app_role() in ('super_admin', 'admin'));

drop policy if exists supplier_bank_accounts_update on public.supplier_bank_accounts;
create policy supplier_bank_accounts_update on public.supplier_bank_accounts
  for update to authenticated
  using (public.current_app_role() in ('super_admin', 'admin'));

drop policy if exists supplier_bank_accounts_delete on public.supplier_bank_accounts;
create policy supplier_bank_accounts_delete on public.supplier_bank_accounts
  for delete to authenticated
  using (public.current_app_role() in ('super_admin', 'admin'));
