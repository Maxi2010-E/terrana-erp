-- Terrana ERP Phase 4: processing session approval — STEP 2 of 2
-- Run AFTER 00013_processing_session_approval.sql has succeeded.

alter table public.processing_sessions
  add column if not exists approved_by uuid references auth.users (id),
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_by uuid references auth.users (id),
  add column if not exists rejected_at timestamptz;

alter table public.processing_sessions
  alter column status set default 'pending_approval';

create index if not exists processing_sessions_pending_approval_idx
  on public.processing_sessions (status, created_at desc)
  where status = 'pending_approval';
