-- Terrana ERP Phase 4: waste recorded as bags × kg per bag

alter table public.waste_records
  add column if not exists number_of_bags integer not null default 0
    check (number_of_bags >= 0),
  add column if not exists kg_per_bag numeric(12, 3)
    check (kg_per_bag is null or kg_per_bag > 0);

-- Preserve existing totals as a single bag at the recorded weight.
update public.waste_records
set
  number_of_bags = 1,
  kg_per_bag = weight_kg
where number_of_bags = 0
  and weight_kg > 0;
