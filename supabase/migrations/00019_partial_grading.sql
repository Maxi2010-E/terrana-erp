-- Terrana ERP: partial pre-stock grading + mixed export inventory names
-- Run after 00018_procurement_pre_stock.sql

-- Pre-stock: track original receipt vs bags still in the room
alter table public.pre_stock
  add column if not exists bags_received integer,
  add column if not exists total_kg_received numeric(12, 3);

update public.pre_stock
set
  bags_received = bags,
  total_kg_received = total_kg
where bags_received is null;

alter table public.pre_stock
  alter column bags_received set not null,
  alter column total_kg_received set not null;

alter table public.pre_stock
  drop constraint if exists pre_stock_bags_received_check;

alter table public.pre_stock
  add constraint pre_stock_bags_received_check
  check (bags_received >= 0 and bags <= bags_received);

alter table public.pre_stock
  drop constraint if exists pre_stock_kg_received_check;

alter table public.pre_stock
  add constraint pre_stock_kg_received_check
  check (total_kg_received > 0 and total_kg <= total_kg_received);

-- Inventory batch: store graded composition for audit
alter table public.inventory_batches
  add column if not exists grade_composition jsonb;

-- Each grading line records how many bags/kg were taken from pre-stock
alter table public.inventory_sources
  add column if not exists bags integer,
  add column if not exists total_kg numeric(12, 3),
  add column if not exists source_product_type text;

update public.inventory_sources inv
set
  bags = ps.bags,
  total_kg = ps.total_kg,
  source_product_type = ps.product_type
from public.pre_stock ps
where ps.id = inv.pre_stock_id
  and inv.bags is null;

alter table public.inventory_sources
  alter column bags set not null,
  alter column total_kg set not null,
  alter column source_product_type set not null;

alter table public.inventory_sources
  drop constraint if exists inventory_sources_bags_check;

alter table public.inventory_sources
  add constraint inventory_sources_bags_check
  check (bags > 0);

alter table public.inventory_sources
  drop constraint if exists inventory_sources_total_kg_check;

alter table public.inventory_sources
  add constraint inventory_sources_total_kg_check
  check (total_kg > 0);

-- Same pre-stock row can feed multiple export batches over time
alter table public.inventory_sources
  drop constraint if exists inventory_sources_pre_stock_id_key;
