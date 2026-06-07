-- Export inventory awaiting warehouse lot assignment (available batches with no lot).

create or replace function public.get_export_unassigned_warehouse_lot_summary()
returns table (
  batches bigint,
  bags bigint,
  total_kg numeric(12, 3)
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    count(*)::bigint as batches,
    coalesce(sum(bags), 0)::bigint as bags,
    coalesce(sum(total_kg), 0)::numeric(12, 3) as total_kg
  from public.inventory_batches
  where status = 'available'
    and bags > 0
    and total_kg > 0
    and warehouse_lot_id is null;
$$;

grant execute on function public.get_export_unassigned_warehouse_lot_summary() to authenticated;
