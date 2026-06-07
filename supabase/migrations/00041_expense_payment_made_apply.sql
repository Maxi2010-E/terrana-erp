-- STEP 2 of 2 — run AFTER 00040_expense_payment_made_enum.sql has committed.
-- Do not combine with the enum migration in one SQL Editor run.

alter table public.daily_expenses
  add column if not exists payment_made_at timestamptz,
  add column if not exists payment_made_by uuid references public.users (id);

alter table public.operational_expenses
  add column if not exists payment_made_at timestamptz,
  add column if not exists payment_made_by uuid references public.users (id);

-- Legacy rows were treated as fully paid when status was approved.
update public.daily_expenses
set
  status = 'payment_made',
  payment_made_at = coalesce(approved_at, updated_at),
  payment_made_by = approved_by
where status = 'approved';

update public.operational_expenses
set
  status = 'payment_made',
  payment_made_at = coalesce(approved_at, updated_at),
  payment_made_by = approved_by
where status = 'approved';

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
        and status = 'payment_made'
    ),
    0
  ) - coalesce(
    (
      select sum(total_amount)
      from public.operational_expenses
      where payment_method = 'cash'
        and status = 'payment_made'
    ),
    0
  );
$$;

create or replace function public.get_petty_cash_committed_cash()
returns numeric(14, 2)
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select sum(amount)
      from public.daily_expenses
      where payment_method = 'cash'
        and status = 'approved'
    ),
    0
  ) + coalesce(
    (
      select sum(total_amount)
      from public.operational_expenses
      where payment_method = 'cash'
        and status = 'approved'
    ),
    0
  );
$$;

grant execute on function public.get_petty_cash_committed_cash() to authenticated;

create or replace function public.validate_daily_expense_petty_cash()
returns trigger
language plpgsql
as $$
declare
  current_balance numeric(14, 2);
  committed numeric(14, 2);
  available numeric(14, 2);
begin
  if new.status = 'approved' and new.payment_method = 'cash' then
    committed := public.get_petty_cash_committed_cash();

    if tg_op = 'UPDATE' and old.status = 'approved' and old.id = new.id then
      if old.payment_method = 'cash' then
        committed := committed - old.amount;
      end if;
    end if;

    available :=
      public.get_petty_cash_balance() - committed;

    if new.amount > available then
      raise exception 'Approving this expense would exceed available petty cash';
    end if;
  end if;

  if new.status = 'payment_made' and new.payment_method = 'cash' then
    select public.get_petty_cash_balance() into current_balance;

    if tg_op = 'UPDATE'
      and old.status = 'payment_made'
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

create or replace function public.validate_operational_expense_petty_cash()
returns trigger
language plpgsql
as $$
declare
  current_balance numeric(14, 2);
  committed numeric(14, 2);
  available numeric(14, 2);
begin
  if new.status = 'approved' and new.payment_method = 'cash' then
    committed := public.get_petty_cash_committed_cash();

    if tg_op = 'UPDATE' and old.status = 'approved' and old.id = new.id then
      if old.payment_method = 'cash' then
        committed := committed - old.total_amount;
      end if;
    end if;

    available :=
      public.get_petty_cash_balance() - committed;

    if new.total_amount > available then
      raise exception 'Approving this expense would exceed available petty cash';
    end if;
  end if;

  if new.status = 'payment_made' and new.payment_method = 'cash' then
    select public.get_petty_cash_balance() into current_balance;

    if tg_op = 'UPDATE'
      and old.status = 'payment_made'
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

create index if not exists daily_expenses_approved_awaiting_payment_idx
  on public.daily_expenses (status)
  where status = 'approved';

create index if not exists operational_expenses_approved_awaiting_payment_idx
  on public.operational_expenses (status)
  where status = 'approved';

create or replace function public.get_dashboard_kpi_metrics(
  month_start date,
  month_end date
)
returns json
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  result json;
begin
  select json_build_object(
    'procurement_kg',
      coalesce(
        (select sum(total_kg) from public.procurement_batches where status = 'approved'),
        0
      ),
    'inventory_kg',
      coalesce(
        (select sum(total_kg) from public.inventory_batches where status = 'available'),
        0
      ),
    'active_suppliers',
      coalesce(
        (select count(*)::bigint from public.suppliers where status = 'active'),
        0
      ),
    'containers_in_transit',
      coalesce(
        (select count(*)::bigint from public.shipments where status = 'in_transit'),
        0
      ),
    'monthly_expenses',
      coalesce(
        (select sum(amount) from public.daily_expenses
         where status = 'payment_made'
           and expense_date between month_start and month_end),
        0
      )
      + coalesce(
        (select sum(total_amount) from public.operational_expenses
         where status = 'payment_made'
           and expense_date between month_start and month_end),
        0
      ),
    'monthly_procurement_value',
      coalesce(
        (select sum(total_value) from public.procurement_batches
         where status = 'approved'
           and procurement_date between month_start and month_end),
        0
      ),
    'monthly_shipments',
      coalesce(
        (select count(*)::bigint from public.shipments
         where loading_date between month_start and month_end),
        0
      )
  ) into result;

  return result;
end;
$$;
