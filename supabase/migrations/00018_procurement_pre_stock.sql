-- Terrana ERP: pre-stock from approved procurement (quality decision pre_stock)
-- Backfill existing approved batches + prevent duplicate pre-stock per source.

create unique index if not exists pre_stock_source_unique_idx
  on public.pre_stock (source_type, source_id);

insert into public.pre_stock (
  source_type,
  source_id,
  product_type,
  bags,
  total_kg,
  date_received,
  status
)
select
  'procurement'::public.pre_stock_source_type,
  pb.id,
  pb.product_type,
  pb.number_of_bags,
  pb.total_kg,
  pb.procurement_date,
  'available'::public.pre_stock_status
from public.procurement_batches pb
where pb.status = 'approved'
  and pb.quality_decision = 'pre_stock'
  and not exists (
    select 1
    from public.pre_stock ps
    where ps.source_type = 'procurement'
      and ps.source_id = pb.id
  );
