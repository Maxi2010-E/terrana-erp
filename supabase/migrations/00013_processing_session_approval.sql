-- Terrana ERP Phase 4: processing session approval — STEP 1 of 2
-- Run this ENTIRE file as ONE query in Supabase SQL Editor. Wait for success.
-- Then run 00014_processing_session_approval_apply.sql in a NEW query.
--
-- Verify after this step:
--   select unnest(enum_range(null::processing_session_status));
-- Should include pending_approval and rejected.

alter type public.processing_session_status add value if not exists 'pending_approval';

alter type public.processing_session_status add value if not exists 'rejected';
