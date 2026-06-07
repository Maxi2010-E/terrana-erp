-- Cash manager: read processing sessions (operational expense links + payment context).

drop policy if exists processing_sessions_select on public.processing_sessions;
create policy processing_sessions_select on public.processing_sessions
  for select to authenticated
  using (
    public.rbac_in(array[
      'super_admin',
      'admin',
      'warehouse_manager',
      'cash_manager',
      'logistics_manager'
    ])
  );
