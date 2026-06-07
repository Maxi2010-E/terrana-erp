-- Terrana ERP Phase 3: procurement batches
-- Run in Supabase Dashboard → SQL Editor after 00006_phase2_suppliers.sql

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.procurement_type as enum ('on_site', 'off_site');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.product_condition as enum ('raw', 'clean', 'mixed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.product_age as enum ('new', 'old');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.product_color as enum ('red', 'black');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.mixed_type as enum (
    'red_mixed',
    'black_mixed',
    'combined_mixed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.quality_decision as enum ('pre_stock', 'processing');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.procurement_payment_status as enum (
    'unpaid',
    'partially_paid',
    'paid'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.procurement_status as enum (
    'pending_approval',
    'approved'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Procurement batches
-- ---------------------------------------------------------------------------
create table if not exists public.procurement_batches (
  id uuid primary key default gen_random_uuid(),
  batch_number text not null unique,
  procurement_type public.procurement_type not null,
  product_condition public.product_condition not null,
  product_age public.product_age,
  product_color public.product_color,
  mixed_type public.mixed_type,
  product_type text not null,
  supplier_id uuid not null references public.suppliers (id),
  number_of_bags integer not null check (number_of_bags > 0),
  kg_per_bag numeric(12, 3),
  extra_kg numeric(12, 3) not null default 0,
  total_kg numeric(12, 3) not null check (total_kg > 0),
  unit_price numeric(12, 2) not null default 0 check (unit_price >= 0),
  total_value numeric(14, 2) not null default 0 check (total_value >= 0),
  procurement_date date not null default current_date,
  received_by uuid references public.employees (id),
  quality_decision public.quality_decision not null,
  payment_status public.procurement_payment_status not null default 'unpaid',
  status public.procurement_status not null default 'pending_approval',
  notes text,
  created_by uuid references auth.users (id),
  approved_by uuid references auth.users (id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists procurement_batches_supplier_idx
  on public.procurement_batches (supplier_id);

create index if not exists procurement_batches_date_idx
  on public.procurement_batches (procurement_date desc);

create index if not exists procurement_batches_status_idx
  on public.procurement_batches (status);

create index if not exists procurement_batches_payment_idx
  on public.procurement_batches (payment_status);

drop trigger if exists procurement_batches_updated_at on public.procurement_batches;
create trigger procurement_batches_updated_at
  before update on public.procurement_batches
  for each row execute function public.set_updated_at();

create or replace function public.generate_procurement_batch_number()
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
        regexp_replace(batch_number, '^PR-' || year_part || '-', ''),
        batch_number
      )::integer
    ),
    0
  ) + 1
  into next_num
  from public.procurement_batches
  where batch_number like 'PR-' || year_part || '-%';

  return 'PR-' || year_part || '-' || lpad(next_num::text, 6, '0');
end;
$$;

grant execute on function public.generate_procurement_batch_number() to authenticated;

create or replace function public.set_procurement_batch_number()
returns trigger
language plpgsql
as $$
begin
  if new.batch_number is null or new.batch_number = '' then
    new.batch_number := public.generate_procurement_batch_number();
  end if;
  return new;
end;
$$;

drop trigger if exists procurement_batches_set_number on public.procurement_batches;
create trigger procurement_batches_set_number
  before insert on public.procurement_batches
  for each row execute function public.set_procurement_batch_number();

-- Auto-inactivate suppliers with no procurement in 90 days
create or replace function public.sync_supplier_inactivity()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.suppliers s
  set status = 'inactive', updated_at = now()
  where s.status = 'active'
    and s.created_at <= current_date - interval '90 days'
    and not exists (
      select 1
      from public.procurement_batches pb
      where pb.supplier_id = s.id
        and pb.procurement_date >= current_date - interval '90 days'
    );
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.procurement_batches enable row level security;

drop policy if exists procurement_batches_select on public.procurement_batches;
create policy procurement_batches_select on public.procurement_batches
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts')
  );

drop policy if exists procurement_batches_insert on public.procurement_batches;
create policy procurement_batches_insert on public.procurement_batches
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin', 'accounts')
  );

drop policy if exists procurement_batches_update on public.procurement_batches;
create policy procurement_batches_update on public.procurement_batches
  for update to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts')
  );

grant execute on function public.sync_supplier_inactivity() to authenticated;

grant select, insert, update on public.procurement_batches to authenticated;
