-- Terrana ERP Phase 6: link supplier payments to payout bank account
-- Run in Supabase Dashboard → SQL Editor after 00021_phase6_payments.sql

alter table public.supplier_payments
  add column if not exists bank_account_id uuid references public.supplier_bank_accounts (id);

create index if not exists supplier_payments_bank_account_idx
  on public.supplier_payments (bank_account_id);

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

  if new.payment_method = 'transfer' then
    if new.bank_account_id is null then
      raise exception 'Transfer payments require a supplier bank account';
    end if;

    if not exists (
      select 1
      from public.supplier_bank_accounts
      where id = new.bank_account_id
        and supplier_id = new.supplier_id
    ) then
      raise exception 'Bank account must belong to payment supplier';
    end if;
  elsif new.payment_method = 'cash' then
    new.bank_account_id := null;
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
  before insert or update of amount, status, batch_id, supplier_id, payment_method, bank_account_id
  on public.supplier_payments
  for each row execute function public.validate_supplier_payment_amount();
