-- One grading operational expense per inventory batch (pending or approved)
-- Run after 00026_phase7_expenses.sql

create unique index if not exists operational_expenses_grading_batch_unique_idx
  on public.operational_expenses (inventory_batch_id)
  where expense_type = 'grading'
    and status in ('pending_approval', 'approved')
    and inventory_batch_id is not null;
