-- Warehouse lots: physical stack locations for export inventory (INV batches).
-- Partial container loads via shipment_lot_loads; remainders stay in the same lot.

-- ---------------------------------------------------------------------------
-- Warehouse lots
-- ---------------------------------------------------------------------------
create table if not exists public.warehouse_lots (
  id uuid primary key default gen_random_uuid(),
  lot_code text not null unique,
  label text not null,
  location_notes text,
  stacked_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists warehouse_lots_label_idx on public.warehouse_lots (label);

drop trigger if exists warehouse_lots_updated_at on public.warehouse_lots;
create trigger warehouse_lots_updated_at
  before update on public.warehouse_lots
  for each row execute function public.set_updated_at();

create or replace function public.generate_warehouse_lot_code()
returns text
language plpgsql
as $$
declare
  year_part text := to_char(current_date, 'YYYY');
  next_num integer;
begin
  select coalesce(
    max(
      nullif(
        regexp_replace(lot_code, '^WHL-' || year_part || '-', ''),
        lot_code
      )::integer
    ),
    0
  ) + 1
  into next_num
  from public.warehouse_lots
  where lot_code like 'WHL-' || year_part || '-%';

  return 'WHL-' || year_part || '-' || lpad(next_num::text, 6, '0');
end;
$$;

grant execute on function public.generate_warehouse_lot_code() to authenticated;

create or replace function public.set_warehouse_lot_code()
returns trigger
language plpgsql
as $$
begin
  if new.lot_code is null or new.lot_code = '' then
    new.lot_code := public.generate_warehouse_lot_code();
  end if;
  return new;
end;
$$;

drop trigger if exists warehouse_lots_set_code on public.warehouse_lots;
create trigger warehouse_lots_set_code
  before insert on public.warehouse_lots
  for each row execute function public.set_warehouse_lot_code();

-- ---------------------------------------------------------------------------
-- Assign export batches to a warehouse lot
-- ---------------------------------------------------------------------------
alter table public.inventory_batches
  add column if not exists warehouse_lot_id uuid references public.warehouse_lots (id);

create index if not exists inventory_batches_warehouse_lot_idx
  on public.inventory_batches (warehouse_lot_id)
  where warehouse_lot_id is not null;

-- Allow depleted batches (fully loaded onto shipments)
alter table public.inventory_batches
  drop constraint if exists inventory_batches_total_kg_check;

alter table public.inventory_batches
  add constraint inventory_batches_weight_check
  check (
    (bags > 0 and total_kg > 0)
    or (bags = 0 and total_kg = 0)
  );

-- ---------------------------------------------------------------------------
-- Shipment loads from warehouse lots (partial bags per INV)
-- ---------------------------------------------------------------------------
create table if not exists public.shipment_lot_loads (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  warehouse_lot_id uuid not null references public.warehouse_lots (id),
  inventory_batch_id uuid not null references public.inventory_batches (id),
  bags integer not null check (bags > 0),
  total_kg numeric(12, 3) not null check (total_kg > 0),
  created_at timestamptz not null default now()
);

create index if not exists shipment_lot_loads_shipment_idx
  on public.shipment_lot_loads (shipment_id);

create index if not exists shipment_lot_loads_lot_idx
  on public.shipment_lot_loads (warehouse_lot_id);

create index if not exists shipment_lot_loads_batch_idx
  on public.shipment_lot_loads (inventory_batch_id);

-- Legacy full-batch allocation: allow multiple shipment lines per INV (partial loads)
alter table public.shipment_inventory
  drop constraint if exists shipment_inventory_batch_unique;

-- ---------------------------------------------------------------------------
-- Apply partial load: decrement batch; allocate when depleted
-- ---------------------------------------------------------------------------
create or replace function public.apply_shipment_lot_load()
returns trigger
language plpgsql
as $$
declare
  batch_bags integer;
  batch_kg numeric(12, 3);
  batch_status public.pre_stock_status;
  batch_lot_id uuid;
  kg_per_bag numeric(12, 6);
  unload_kg numeric(12, 3);
  remaining_bags integer;
  remaining_kg numeric(12, 3);
begin
  select ib.bags, ib.total_kg, ib.status, ib.warehouse_lot_id
  into batch_bags, batch_kg, batch_status, batch_lot_id
  from public.inventory_batches ib
  where ib.id = new.inventory_batch_id
  for update;

  if batch_status is distinct from 'available' then
    raise exception 'Inventory batch is not available for shipment allocation';
  end if;

  if batch_lot_id is distinct from new.warehouse_lot_id then
    raise exception 'Inventory batch is not assigned to the selected warehouse lot';
  end if;

  if new.bags > batch_bags then
    raise exception 'Load exceeds bags remaining on inventory batch';
  end if;

  if new.bags = batch_bags then
    unload_kg := batch_kg;
  else
    kg_per_bag := batch_kg / batch_bags::numeric;
    unload_kg := round(kg_per_bag * new.bags::numeric, 3);
  end if;

  if abs(unload_kg - new.total_kg) > 0.05 then
    raise exception 'Load weight does not match batch average for selected bags';
  end if;

  remaining_bags := batch_bags - new.bags;
  remaining_kg := batch_kg - unload_kg;

  update public.inventory_batches
  set
    bags = remaining_bags,
    total_kg = remaining_kg,
    status = case
      when remaining_bags = 0 then 'allocated'::public.pre_stock_status
      else batch_status
    end
  where id = new.inventory_batch_id;

  return new;
end;
$$;

drop trigger if exists shipment_lot_loads_apply on public.shipment_lot_loads;
create trigger shipment_lot_loads_apply
  after insert on public.shipment_lot_loads
  for each row execute function public.apply_shipment_lot_load();

-- Legacy shipment_inventory: partial decrement (same rules, no lot check)
create or replace function public.allocate_inventory_for_shipment()
returns trigger
language plpgsql
as $$
declare
  batch_bags integer;
  batch_kg numeric(12, 3);
  batch_status public.pre_stock_status;
  kg_per_bag numeric(12, 6);
  unload_kg numeric(12, 3);
  remaining_bags integer;
  remaining_kg numeric(12, 3);
begin
  select ib.bags, ib.total_kg, ib.status
  into batch_bags, batch_kg, batch_status
  from public.inventory_batches ib
  where ib.id = new.inventory_batch_id
  for update;

  if batch_status is distinct from 'available' then
    raise exception 'Inventory batch is not available for shipment allocation';
  end if;

  if new.bags > batch_bags then
    raise exception 'Load exceeds bags remaining on inventory batch';
  end if;

  if new.bags = batch_bags then
    unload_kg := batch_kg;
  else
    kg_per_bag := batch_kg / batch_bags::numeric;
    unload_kg := round(kg_per_bag * new.bags::numeric, 3);
  end if;

  if abs(unload_kg - new.total_kg) > 0.05 then
    raise exception 'Load weight does not match batch average for selected bags';
  end if;

  remaining_bags := batch_bags - new.bags;
  remaining_kg := batch_kg - unload_kg;

  update public.inventory_batches
  set
    bags = remaining_bags,
    total_kg = remaining_kg,
    status = case
      when remaining_bags = 0 then 'allocated'::public.pre_stock_status
      else batch_status
    end
  where id = new.inventory_batch_id;

  return new;
end;
$$;

-- Shipped when container delivered (lot loads + legacy lines)
create or replace function public.sync_inventory_on_shipment_status()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'delivered' and old.status is distinct from 'delivered' then
    update public.inventory_batches ib
    set status = 'shipped'
    from public.shipment_lot_loads sl
    where sl.shipment_id = new.id
      and sl.inventory_batch_id = ib.id
      and ib.status = 'allocated';

    update public.inventory_batches ib
    set status = 'shipped'
    from public.shipment_inventory si
    where si.shipment_id = new.id
      and si.inventory_batch_id = ib.id
      and ib.status = 'allocated';
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.warehouse_lots enable row level security;
alter table public.shipment_lot_loads enable row level security;

drop policy if exists warehouse_lots_select on public.warehouse_lots;
create policy warehouse_lots_select on public.warehouse_lots
  for select to authenticated
  using (
    public.current_app_role() in (
      'super_admin',
      'admin',
      'inventory_manager',
      'logistics_manager'
    )
  );

drop policy if exists warehouse_lots_insert on public.warehouse_lots;
create policy warehouse_lots_insert on public.warehouse_lots
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin', 'inventory_manager')
  );

drop policy if exists warehouse_lots_update on public.warehouse_lots;
create policy warehouse_lots_update on public.warehouse_lots
  for update to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'inventory_manager')
  );

drop policy if exists shipment_lot_loads_select on public.shipment_lot_loads;
create policy shipment_lot_loads_select on public.shipment_lot_loads
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'logistics_manager')
  );

drop policy if exists shipment_lot_loads_insert on public.shipment_lot_loads;
create policy shipment_lot_loads_insert on public.shipment_lot_loads
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin', 'logistics_manager')
  );

-- Logistics needs to read export batches when loading containers
drop policy if exists inventory_batches_select on public.inventory_batches;
create policy inventory_batches_select on public.inventory_batches
  for select to authenticated
  using (
    public.current_app_role() in (
      'super_admin',
      'admin',
      'inventory_manager',
      'logistics_manager'
    )
  );

grant select, insert, update on public.warehouse_lots to authenticated;
grant select, insert on public.shipment_lot_loads to authenticated;
