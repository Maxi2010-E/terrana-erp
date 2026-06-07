-- Auto-set employee_code on insert (avoids extra RPC round trip from the app)
create or replace function public.set_employee_code()
returns trigger
language plpgsql
as $$
begin
  if new.employee_code is null or new.employee_code = '' then
    new.employee_code := public.generate_employee_code();
  end if;
  return new;
end;
$$;

drop trigger if exists employees_set_code on public.employees;
create trigger employees_set_code
  before insert on public.employees
  for each row execute function public.set_employee_code();
