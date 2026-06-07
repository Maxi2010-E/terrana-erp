-- Expense payment_made migration — TWO separate SQL Editor runs (required by PostgreSQL).
--
-- RUN 1 — only this statement, click Run, wait for success:
ALTER TYPE public.expense_record_status ADD VALUE IF NOT EXISTS 'payment_made';

-- RUN 2 — open and run the entire file (separate execution):
--   supabase/migrations/00041_expense_payment_made_apply.sql
--
-- Verify after RUN 1:
-- SELECT unnest(enum_range(NULL::public.expense_record_status));
