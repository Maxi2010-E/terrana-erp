-- One field transfer out operational expense per processing session (pending or approved)
-- Run after 00026_phase7_expenses.sql

create unique index if not exists operational_expenses_field_transfer_out_session_unique_idx
  on public.operational_expenses (processing_session_id)
  where expense_type = 'field_transfer_out'
    and status in ('pending_approval', 'approved')
    and processing_session_id is not null;
