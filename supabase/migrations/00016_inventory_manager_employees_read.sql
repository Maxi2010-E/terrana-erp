-- Allow inventory managers to read active employees (processing "processed by" dropdown)

drop policy if exists employees_select on public.employees;
create policy employees_select on public.employees
  for select to authenticated
  using (
    public.current_app_role() in (
      'super_admin',
      'admin',
      'accounts',
      'inventory_manager'
    )
    or id = (select employee_id from public.users where id = auth.uid())
  );
