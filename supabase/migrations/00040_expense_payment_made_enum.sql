-- STEP 1 of 2 — run THIS FILE ALONE in Supabase SQL Editor, then run
-- 00041_expense_payment_made_apply.sql in a second execution.
--
-- PostgreSQL cannot use a new enum value in the same transaction as ADD VALUE
-- (error 55P04: unsafe use of new value).

alter type public.expense_record_status add value if not exists 'payment_made';
