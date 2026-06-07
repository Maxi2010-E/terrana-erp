-- Terrana ERP Phase 9: dashboard KPI metrics via RPC (PostgREST aggregates are disabled by default)
-- Run in Supabase Dashboard → SQL Editor after 00035_operational_expense_shipment_unique.sql

create or replace function public.get_dashboard_kpi_metrics(
  month_start date,
  month_end date
)
returns json
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  result json;
begin
  select json_build_object(
    'procurement_kg',
      coalesce(
        (select sum(total_kg) from public.procurement_batches where status = 'approved'),
        0
      ),
    'inventory_kg',
      coalesce(
        (select sum(total_kg) from public.inventory_batches where status = 'available'),
        0
      ),
    'active_suppliers',
      coalesce(
        (select count(*)::bigint from public.suppliers where status = 'active'),
        0
      ),
    'containers_in_transit',
      coalesce(
        (select count(*)::bigint from public.shipments where status = 'in_transit'),
        0
      ),
    'monthly_expenses',
      coalesce(
        (select sum(amount) from public.daily_expenses
         where status = 'approved'
           and expense_date between month_start and month_end),
        0
      )
      + coalesce(
        (select sum(total_amount) from public.operational_expenses
         where status = 'approved'
           and expense_date between month_start and month_end),
        0
      ),
    'monthly_procurement_value',
      coalesce(
        (select sum(total_value) from public.procurement_batches
         where status = 'approved'
           and procurement_date between month_start and month_end),
        0
      ),
    'monthly_shipments',
      coalesce(
        (select count(*)::bigint from public.shipments
         where loading_date between month_start and month_end),
        0
      )
  )
  into result;

  return result;
end;
$$;

revoke all on function public.get_dashboard_kpi_metrics(date, date) from public;
grant execute on function public.get_dashboard_kpi_metrics(date, date) to authenticated;
