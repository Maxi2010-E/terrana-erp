-- One truck offloading / field transfer in expense per linked record (pending or approved)
-- Run after 00026_phase7_expenses.sql

create unique index if not exists operational_expenses_truck_offloading_batch_unique_idx
  on public.operational_expenses (procurement_batch_id)
  where expense_type = 'truck_offloading'
    and status in ('pending_approval', 'approved')
    and procurement_batch_id is not null;

create unique index if not exists operational_expenses_field_transfer_in_pre_stock_unique_idx
  on public.operational_expenses (pre_stock_id)
  where expense_type = 'field_transfer_in'
    and status in ('pending_approval', 'approved')
    and pre_stock_id is not null;
