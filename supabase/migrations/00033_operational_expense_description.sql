-- Miscellaneous operational expenses require a description so approvers know what was paid for.

alter table public.operational_expenses
  add column if not exists description text;

alter table public.operational_expenses
  drop constraint if exists operational_expenses_description_check;

alter table public.operational_expenses
  add constraint operational_expenses_description_check check (
    (
      expense_type = 'miscellaneous'
      and description is not null
      and btrim(description) <> ''
    )
    or (
      expense_type <> 'miscellaneous'
      and description is null
    )
  );
