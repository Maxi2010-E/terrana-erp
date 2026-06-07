-- Terrana ERP Phase 4: allow accounts role to use processing (not approvals — app-enforced)

drop policy if exists processing_sessions_select on public.processing_sessions;
create policy processing_sessions_select on public.processing_sessions
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts', 'inventory_manager')
  );

drop policy if exists processing_sessions_insert on public.processing_sessions;
create policy processing_sessions_insert on public.processing_sessions
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin', 'accounts', 'inventory_manager')
  );

drop policy if exists processing_sessions_update on public.processing_sessions;
create policy processing_sessions_update on public.processing_sessions
  for update to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts', 'inventory_manager')
  );

drop policy if exists processing_outputs_select on public.processing_outputs;
create policy processing_outputs_select on public.processing_outputs
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts', 'inventory_manager')
  );

drop policy if exists processing_outputs_insert on public.processing_outputs;
create policy processing_outputs_insert on public.processing_outputs
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin', 'accounts', 'inventory_manager')
  );

drop policy if exists processing_outputs_update on public.processing_outputs;
create policy processing_outputs_update on public.processing_outputs
  for update to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts', 'inventory_manager')
  );

drop policy if exists waste_records_select on public.waste_records;
create policy waste_records_select on public.waste_records
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts', 'inventory_manager')
  );

drop policy if exists waste_records_insert on public.waste_records;
create policy waste_records_insert on public.waste_records
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin', 'accounts', 'inventory_manager')
  );

drop policy if exists waste_records_update on public.waste_records;
create policy waste_records_update on public.waste_records
  for update to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts', 'inventory_manager')
  );

drop policy if exists waste_records_delete on public.waste_records;
create policy waste_records_delete on public.waste_records
  for delete to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts', 'inventory_manager')
  );

drop policy if exists pre_stock_select on public.pre_stock;
create policy pre_stock_select on public.pre_stock
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts', 'inventory_manager')
  );

drop policy if exists pre_stock_insert on public.pre_stock;
create policy pre_stock_insert on public.pre_stock
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin', 'accounts', 'inventory_manager')
  );

drop policy if exists pre_stock_update on public.pre_stock;
create policy pre_stock_update on public.pre_stock
  for update to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts', 'inventory_manager')
  );
