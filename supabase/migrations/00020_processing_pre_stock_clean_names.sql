-- Terrana ERP: pre-stock from processing should be Clean, not Raw
-- Run after 00019_partial_grading.sql

update public.pre_stock
set product_type = 'Clean ' || substring(product_type from 5)
where source_type = 'processing'
  and product_type like 'Raw %';

update public.inventory_sources inv
set source_product_type = ps.product_type
from public.pre_stock ps
where ps.id = inv.pre_stock_id
  and inv.source_product_type like 'Raw %'
  and ps.product_type like 'Clean %';

update public.inventory_batches
set product_type = 'Clean ' || substring(product_type from 5)
where product_type like 'Raw %';

update public.inventory_batches
set grade_composition = jsonb_set(
  grade_composition,
  '{derived_label}',
  to_jsonb('Clean ' || substring(grade_composition->>'derived_label' from 5))
)
where grade_composition is not null
  and grade_composition->>'derived_label' like 'Raw %';

update public.inventory_batches ib
set grade_composition = jsonb_set(
  ib.grade_composition,
  '{lines}',
  sub.fixed_lines
)
from (
  select
    ib2.id,
    jsonb_agg(
      case
        when line->>'source_product_type' like 'Raw %' then
          jsonb_set(
            line,
            '{source_product_type}',
            to_jsonb('Clean ' || substring(line->>'source_product_type' from 5))
          )
        else line
      end
    ) as fixed_lines
  from public.inventory_batches ib2
  cross join lateral jsonb_array_elements(ib2.grade_composition->'lines') as line
  where ib2.grade_composition is not null
  group by ib2.id
) sub
where ib.id = sub.id
  and ib.grade_composition is not null;
