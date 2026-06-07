-- Terrana ERP: RBAC + dual approval — STEP 1 of 2
-- Run THIS FILE ALONE in Supabase SQL Editor. Wait for success.
-- Then run 00050_rbac_and_dual_approval_apply.sql in a NEW query.
--
-- PostgreSQL cannot use a new enum value in the same transaction as ADD VALUE
-- (error 55P04: unsafe use of new value).

alter type public.app_role add value if not exists 'warehouse_manager';
alter type public.app_role add value if not exists 'cash_manager';

alter type public.procurement_status add value if not exists 'pending_second_approval';
alter type public.procurement_status add value if not exists 'pending_admin_approval';
alter type public.procurement_status add value if not exists 'rejected';

alter type public.processing_session_status add value if not exists 'pending_second_approval';
alter type public.processing_session_status add value if not exists 'pending_admin_approval';
