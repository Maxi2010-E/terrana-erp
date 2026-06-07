-- Terrana ERP: RBAC role redesign + dual approval — STEP 2 of 2
-- Prerequisite: 00049_rbac_enum_values.sql must have run successfully first.

-- ---------------------------------------------------------------------------
-- Remap legacy roles
-- ---------------------------------------------------------------------------
update public.users
set role = 'warehouse_manager'::public.app_role
where role = 'inventory_manager'::public.app_role;

update public.users
set role = 'cash_manager'::public.app_role
where role = 'accounts'::public.app_role;

-- ---------------------------------------------------------------------------
-- Dual approval columns
-- ---------------------------------------------------------------------------
alter table public.procurement_batches
  add column if not exists first_approved_by uuid references auth.users (id),
  add column if not exists first_approved_at timestamptz,
  add column if not exists second_approved_by uuid references auth.users (id),
  add column if not exists second_approved_at timestamptz,
  add column if not exists rejected_by uuid references auth.users (id),
  add column if not exists rejected_at timestamptz;

alter table public.processing_sessions
  add column if not exists first_approved_by uuid references auth.users (id),
  add column if not exists first_approved_at timestamptz,
  add column if not exists second_approved_by uuid references auth.users (id),
  add column if not exists second_approved_at timestamptz;

-- ---------------------------------------------------------------------------
-- RBAC helpers (normalize legacy enum + group checks)
-- ---------------------------------------------------------------------------
create or replace function public.rbac_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case public.current_app_role()::text
    when 'accounts' then 'cash_manager'
    when 'inventory_manager' then 'warehouse_manager'
    else public.current_app_role()::text
  end;
$$;

create or replace function public.rbac_in(roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.rbac_role() = any (roles);
$$;

grant execute on function public.rbac_role() to authenticated;
grant execute on function public.rbac_in(text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Procurement batches
-- ---------------------------------------------------------------------------
drop policy if exists procurement_batches_select on public.procurement_batches;
create policy procurement_batches_select on public.procurement_batches
  for select to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager', 'logistics_manager'])
  );

drop policy if exists procurement_batches_insert on public.procurement_batches;
create policy procurement_batches_insert on public.procurement_batches
  for insert to authenticated
  with check (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager'])
  );

drop policy if exists procurement_batches_update on public.procurement_batches;
create policy procurement_batches_update on public.procurement_batches
  for update to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager', 'logistics_manager'])
  );

-- ---------------------------------------------------------------------------
-- Processing + waste + pre-stock (warehouse writes; logistics reads)
-- ---------------------------------------------------------------------------
drop policy if exists processing_sessions_select on public.processing_sessions;
create policy processing_sessions_select on public.processing_sessions
  for select to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager', 'logistics_manager'])
  );

drop policy if exists processing_sessions_insert on public.processing_sessions;
create policy processing_sessions_insert on public.processing_sessions
  for insert to authenticated
  with check (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager'])
  );

drop policy if exists processing_sessions_update on public.processing_sessions;
create policy processing_sessions_update on public.processing_sessions
  for update to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager', 'logistics_manager'])
  );

drop policy if exists processing_outputs_select on public.processing_outputs;
create policy processing_outputs_select on public.processing_outputs
  for select to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager', 'logistics_manager'])
  );

drop policy if exists processing_outputs_insert on public.processing_outputs;
create policy processing_outputs_insert on public.processing_outputs
  for insert to authenticated
  with check (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager'])
  );

drop policy if exists processing_outputs_update on public.processing_outputs;
create policy processing_outputs_update on public.processing_outputs
  for update to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager'])
  );

drop policy if exists waste_records_select on public.waste_records;
create policy waste_records_select on public.waste_records
  for select to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager'])
  );

drop policy if exists waste_records_insert on public.waste_records;
create policy waste_records_insert on public.waste_records
  for insert to authenticated
  with check (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager'])
  );

drop policy if exists waste_records_update on public.waste_records;
create policy waste_records_update on public.waste_records
  for update to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager'])
  );

drop policy if exists waste_records_delete on public.waste_records;
create policy waste_records_delete on public.waste_records
  for delete to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager'])
  );

drop policy if exists pre_stock_select on public.pre_stock;
create policy pre_stock_select on public.pre_stock
  for select to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager', 'cash_manager', 'logistics_manager'])
  );

drop policy if exists pre_stock_insert on public.pre_stock;
create policy pre_stock_insert on public.pre_stock
  for insert to authenticated
  with check (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager'])
  );

drop policy if exists pre_stock_update on public.pre_stock;
create policy pre_stock_update on public.pre_stock
  for update to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager'])
  );

-- ---------------------------------------------------------------------------
-- Suppliers (read: warehouse + logistics; write: admin)
-- ---------------------------------------------------------------------------
drop policy if exists suppliers_select on public.suppliers;
create policy suppliers_select on public.suppliers
  for select to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager', 'logistics_manager'])
  );

drop policy if exists suppliers_insert on public.suppliers;
create policy suppliers_insert on public.suppliers
  for insert to authenticated
  with check (
    public.rbac_in(array['super_admin', 'admin'])
  );

drop policy if exists suppliers_update on public.suppliers;
create policy suppliers_update on public.suppliers
  for update to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin'])
  );

-- ---------------------------------------------------------------------------
-- Payments (admin write; cash read)
-- ---------------------------------------------------------------------------
drop policy if exists supplier_payments_select on public.supplier_payments;
create policy supplier_payments_select on public.supplier_payments
  for select to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'cash_manager'])
  );

drop policy if exists supplier_payments_insert on public.supplier_payments;
create policy supplier_payments_insert on public.supplier_payments
  for insert to authenticated
  with check (
    public.rbac_in(array['super_admin', 'admin'])
  );

drop policy if exists supplier_payments_update on public.supplier_payments;
create policy supplier_payments_update on public.supplier_payments
  for update to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin'])
  );

-- ---------------------------------------------------------------------------
-- Expenses (warehouse + cash + admin; not logistics)
-- ---------------------------------------------------------------------------
drop policy if exists petty_cash_top_ups_select on public.petty_cash_top_ups;
create policy petty_cash_top_ups_select on public.petty_cash_top_ups
  for select to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager', 'cash_manager'])
  );

drop policy if exists petty_cash_top_ups_insert on public.petty_cash_top_ups;
create policy petty_cash_top_ups_insert on public.petty_cash_top_ups
  for insert to authenticated
  with check (
    public.rbac_in(array['super_admin', 'admin', 'cash_manager'])
  );

drop policy if exists daily_expenses_select on public.daily_expenses;
create policy daily_expenses_select on public.daily_expenses
  for select to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager', 'cash_manager'])
  );

drop policy if exists daily_expenses_insert on public.daily_expenses;
create policy daily_expenses_insert on public.daily_expenses
  for insert to authenticated
  with check (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager', 'cash_manager'])
  );

drop policy if exists daily_expenses_update on public.daily_expenses;
create policy daily_expenses_update on public.daily_expenses
  for update to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager', 'cash_manager'])
  );

drop policy if exists operational_expenses_select on public.operational_expenses;
create policy operational_expenses_select on public.operational_expenses
  for select to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager', 'cash_manager'])
  );

drop policy if exists operational_expenses_insert on public.operational_expenses;
create policy operational_expenses_insert on public.operational_expenses
  for insert to authenticated
  with check (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager', 'cash_manager'])
  );

drop policy if exists operational_expenses_update on public.operational_expenses;
create policy operational_expenses_update on public.operational_expenses
  for update to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager', 'cash_manager'])
  );

-- ---------------------------------------------------------------------------
-- Inventory batches
-- ---------------------------------------------------------------------------
drop policy if exists inventory_batches_select on public.inventory_batches;
create policy inventory_batches_select on public.inventory_batches
  for select to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager', 'cash_manager', 'logistics_manager'])
  );

drop policy if exists inventory_batches_insert on public.inventory_batches;
create policy inventory_batches_insert on public.inventory_batches
  for insert to authenticated
  with check (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager'])
  );

drop policy if exists inventory_batches_update on public.inventory_batches;
create policy inventory_batches_update on public.inventory_batches
  for update to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager'])
  );

-- ---------------------------------------------------------------------------
-- Employees read (warehouse needs employee pickers)
-- ---------------------------------------------------------------------------
drop policy if exists employees_select on public.employees;
create policy employees_select on public.employees
  for select to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager', 'cash_manager', 'logistics_manager'])
  );

-- ---------------------------------------------------------------------------
-- Waste re-processing tables
-- ---------------------------------------------------------------------------
drop policy if exists waste_reprocessing_sessions_select on public.waste_reprocessing_sessions;
create policy waste_reprocessing_sessions_select on public.waste_reprocessing_sessions
  for select to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager'])
  );

drop policy if exists waste_reprocessing_sessions_insert on public.waste_reprocessing_sessions;
create policy waste_reprocessing_sessions_insert on public.waste_reprocessing_sessions
  for insert to authenticated
  with check (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager'])
  );

drop policy if exists waste_reprocessing_sessions_update on public.waste_reprocessing_sessions;
create policy waste_reprocessing_sessions_update on public.waste_reprocessing_sessions
  for update to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager'])
  );

drop policy if exists waste_reprocessing_outputs_select on public.waste_reprocessing_outputs;
create policy waste_reprocessing_outputs_select on public.waste_reprocessing_outputs
  for select to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager'])
  );

drop policy if exists waste_reprocessing_outputs_insert on public.waste_reprocessing_outputs;
create policy waste_reprocessing_outputs_insert on public.waste_reprocessing_outputs
  for insert to authenticated
  with check (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager'])
  );

drop policy if exists waste_reprocessing_outputs_update on public.waste_reprocessing_outputs;
create policy waste_reprocessing_outputs_update on public.waste_reprocessing_outputs
  for update to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager'])
  );

drop policy if exists waste_reprocessing_byproducts_select on public.waste_reprocessing_byproducts;
create policy waste_reprocessing_byproducts_select on public.waste_reprocessing_byproducts
  for select to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager'])
  );

drop policy if exists waste_reprocessing_byproducts_insert on public.waste_reprocessing_byproducts;
create policy waste_reprocessing_byproducts_insert on public.waste_reprocessing_byproducts
  for insert to authenticated
  with check (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager'])
  );

drop policy if exists waste_reprocessing_byproducts_update on public.waste_reprocessing_byproducts;
create policy waste_reprocessing_byproducts_update on public.waste_reprocessing_byproducts
  for update to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager'])
  );

drop policy if exists waste_local_stock_select on public.waste_local_stock;
create policy waste_local_stock_select on public.waste_local_stock
  for select to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager'])
  );

drop policy if exists waste_local_stock_insert on public.waste_local_stock;
create policy waste_local_stock_insert on public.waste_local_stock
  for insert to authenticated
  with check (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager'])
  );

drop policy if exists waste_local_stock_update on public.waste_local_stock;
create policy waste_local_stock_update on public.waste_local_stock
  for update to authenticated
  using (
    public.rbac_in(array['super_admin', 'admin', 'warehouse_manager'])
  );
