-- Export inventory on-hand totals grouped by graded product type.

create or replace function public.get_export_inventory_available_by_type()
returns table (
  product_type text,
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
    product_type,
    count(*)::bigint as lots,
    coalesce(sum(bags), 0)::bigint as bags,
    coalesce(sum(total_kg), 0)::numeric(12, 3) as total_kg
  from public.inventory_batches
  where status = 'available'
    and bags > 0
    and total_kg > 0
  group by product_type
  order by product_type;
$$;

grant execute on function public.get_export_inventory_available_by_type() to authenticated;
