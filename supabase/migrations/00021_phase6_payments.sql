-- Terrana ERP Phase 6: supplier payments
-- Run in Supabase Dashboard → SQL Editor after 00020_processing_pre_stock_clean_names.sql

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.supplier_payment_method as enum ('cash', 'transfer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.supplier_payment_record_status as enum (
    'pending_approval',
    'approved'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Supplier payments
-- ---------------------------------------------------------------------------
create table if not exists public.supplier_payments (
  id uuid primary key default gen_random_uuid(),
  payment_reference text not null unique,
  supplier_id uuid not null references public.suppliers (id),
  batch_id uuid not null references public.procurement_batches (id),
  amount numeric(14, 2) not null check (amount > 0),
  payment_method public.supplier_payment_method not null,
  payment_date date not null default current_date,
  status public.supplier_payment_record_status not null default 'pending_approval',
  notes text,
  recorded_by uuid references public.users (id),
  approved_by uuid references public.users (id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists supplier_payments_supplier_idx
  on public.supplier_payments (supplier_id);

create index if not exists supplier_payments_batch_idx
  on public.supplier_payments (batch_id);

create index if not exists supplier_payments_date_idx
  on public.supplier_payments (payment_date desc);

create index if not exists supplier_payments_status_idx
  on public.supplier_payments (status);

create index if not exists supplier_payments_pending_idx
  on public.supplier_payments (status)
  where status = 'pending_approval';

drop trigger if exists supplier_payments_updated_at on public.supplier_payments;
create trigger supplier_payments_updated_at
  before update on public.supplier_payments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Payment reference generator
-- ---------------------------------------------------------------------------
create or replace function public.generate_supplier_payment_reference()
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
        regexp_replace(payment_reference, '^PAY-' || year_part || '-', ''),
        payment_reference
      )::integer
    ),
    0
  ) + 1
  into next_num
  from public.supplier_payments
  where payment_reference like 'PAY-' || year_part || '-%';

  return 'PAY-' || year_part || '-' || lpad(next_num::text, 6, '0');
end;
$$;

grant execute on function public.generate_supplier_payment_reference() to authenticated;

create or replace function public.set_supplier_payment_reference()
returns trigger
language plpgsql
as $$
begin
  if new.payment_reference is null or new.payment_reference = '' then
    new.payment_reference := public.generate_supplier_payment_reference();
  end if;
  return new;
end;
$$;

drop trigger if exists supplier_payments_set_reference on public.supplier_payments;
create trigger supplier_payments_set_reference
  before insert on public.supplier_payments
  for each row execute function public.set_supplier_payment_reference();

-- ---------------------------------------------------------------------------
-- Roll up batch payment_status from approved payments
-- ---------------------------------------------------------------------------
create or replace function public.sync_procurement_batch_payment_status(p_batch_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  batch_total numeric(14, 2);
  paid_total numeric(14, 2);
  new_status public.procurement_payment_status;
begin
  select total_value
  into batch_total
  from public.procurement_batches
  where id = p_batch_id;

  if batch_total is null then
    return;
  end if;

  select coalesce(sum(amount), 0)
  into paid_total
  from public.supplier_payments
  where batch_id = p_batch_id
    and status = 'approved';

  if paid_total <= 0 then
    new_status := 'unpaid';
  elsif paid_total >= batch_total then
    new_status := 'paid';
  else
    new_status := 'partially_paid';
  end if;

  update public.procurement_batches
  set payment_status = new_status
  where id = p_batch_id;
end;
$$;

grant execute on function public.sync_procurement_batch_payment_status(uuid) to authenticated;

create or replace function public.validate_supplier_payment_amount()
returns trigger
language plpgsql
as $$
declare
  batch_total numeric(14, 2);
  batch_supplier_id uuid;
  paid_total numeric(14, 2);
  projected_paid numeric(14, 2);
begin
  select total_value, supplier_id
  into batch_total, batch_supplier_id
  from public.procurement_batches
  where id = new.batch_id;

  if batch_supplier_id is distinct from new.supplier_id then
    raise exception 'Payment supplier must match procurement batch supplier';
  end if;

  select coalesce(sum(amount), 0)
  into paid_total
  from public.supplier_payments
  where batch_id = new.batch_id
    and status = 'approved'
    and id is distinct from coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if new.status = 'approved' then
    projected_paid := paid_total + new.amount;
  else
    projected_paid := paid_total;
  end if;

  if new.status = 'approved' and projected_paid > batch_total then
    raise exception 'Payment amount exceeds outstanding balance';
  end if;

  return new;
end;
$$;

drop trigger if exists supplier_payments_validate_amount on public.supplier_payments;
create trigger supplier_payments_validate_amount
  before insert or update of amount, status, batch_id, supplier_id
  on public.supplier_payments
  for each row execute function public.validate_supplier_payment_amount();

create or replace function public.supplier_payments_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_batch_id uuid;
begin
  target_batch_id := coalesce(new.batch_id, old.batch_id);
  perform public.sync_procurement_batch_payment_status(target_batch_id);

  if tg_op = 'UPDATE'
    and old.batch_id is distinct from new.batch_id
    and old.batch_id is not null then
    perform public.sync_procurement_batch_payment_status(old.batch_id);
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists supplier_payments_after_change on public.supplier_payments;
create trigger supplier_payments_after_change
  after insert or update of amount, status, batch_id or delete
  on public.supplier_payments
  for each row execute function public.supplier_payments_after_change();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.supplier_payments enable row level security;

drop policy if exists supplier_payments_select on public.supplier_payments;
create policy supplier_payments_select on public.supplier_payments
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts')
  );

drop policy if exists supplier_payments_insert on public.supplier_payments;
create policy supplier_payments_insert on public.supplier_payments
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin', 'accounts')
  );

drop policy if exists supplier_payments_update on public.supplier_payments;
create policy supplier_payments_update on public.supplier_payments
  for update to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts')
  );

grant select, insert, update on public.supplier_payments to authenticated;
