-- Accurate totals for pre-stock still waiting to be graded (available room stock).

create or replace function public.get_pre_stock_available_summary()
returns table (
  lots bigint,
  bags bigint,
  total_kg numeric(12, 3)
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    count(*)::bigint as lots,
    coalesce(sum(bags), 0)::bigint as bags,
    coalesce(sum(total_kg), 0)::numeric(12, 3) as total_kg
  from public.pre_stock
  where status = 'available'
    and bags > 0
    and total_kg > 0;
$$;

grant execute on function public.get_pre_stock_available_summary() to authenticated;
