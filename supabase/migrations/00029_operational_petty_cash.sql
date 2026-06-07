-- Cash operational expenses deduct from petty cash on approval
-- Run after 00026_phase7_expenses.sql

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
