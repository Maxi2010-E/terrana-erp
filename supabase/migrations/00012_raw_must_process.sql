-- Terrana ERP: raw procurement must always route to processing, never pre-stock

update public.procurement_batches
set quality_decision = 'processing'
where product_condition = 'raw'
  and quality_decision = 'pre_stock';

alter table public.procurement_batches
  drop constraint if exists procurement_batches_raw_must_process;

alter table public.procurement_batches
  add constraint procurement_batches_raw_must_process
  check (
    product_condition <> 'raw'
    or quality_decision = 'processing'
  );
