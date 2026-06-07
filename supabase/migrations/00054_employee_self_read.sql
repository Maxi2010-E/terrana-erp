-- Allow every signed-in user to read their own linked employee row (profile name in header/sidebar).
drop policy if exists employees_select on public.employees;
create policy employees_select on public.employees
  for select to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager', 'cash_manager', 'logistics_manager'])
    or id = (select employee_id from public.users where id = auth.uid())
  );
