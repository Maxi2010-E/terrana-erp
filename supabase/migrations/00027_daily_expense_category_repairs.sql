-- Fix daily_expense_category: app/PRD use 'repairs', not 'cleaning supplies'
-- Run in Supabase SQL Editor if 00026 was applied with the old enum values.

do $$ begin
  alter type public.daily_expense_category add value if not exists 'repairs';
exception
  when duplicate_object then null;
end $$;
