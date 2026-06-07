-- Procurement: cash manager can read batches for warehouse confirmation step.
-- Collapse legacy pending_second_approval into admin queue.

update public.procurement_batches
set status = 'pending_admin_approval'
where status = 'pending_second_approval';

drop policy if exists procurement_batches_select on public.procurement_batches;
create policy procurement_batches_select on public.procurement_batches
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
