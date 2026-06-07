-- One cleaning operational expense per processing session (pending or approved)
-- Run after 00026_phase7_expenses.sql

create unique index if not exists operational_expenses_cleaning_session_unique_idx
  on public.operational_expenses (processing_session_id)
  where expense_type = 'cleaning'
    and status in ('pending_approval', 'approved')
    and processing_session_id is not null;
