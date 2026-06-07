-- Terrana ERP: resolve approver/recorder display names for audit UI
-- Run in Supabase Dashboard → SQL Editor after 00022_payment_bank_account.sql

drop function if exists public.resolve_user_emails(uuid[]);

create or replace function public.resolve_user_display_names(user_ids uuid[])
returns table (id uuid, display_name text)
language sql
security definer
set search_path = public
stable
as $$
  select
    u.id,
    coalesce(
      nullif(trim(concat(e.first_name, ' ', e.last_name)), ''),
      nullif(trim(u.username), ''),
      nullif(split_part(u.email, '@', 1), ''),
      u.email
    ) as display_name
  from public.users u
  left join public.employees e on e.id = u.employee_id
  where user_ids is not null
    and cardinality(user_ids) > 0
    and u.id = any(user_ids);
$$;

grant execute on function public.resolve_user_display_names(uuid[]) to authenticated;
