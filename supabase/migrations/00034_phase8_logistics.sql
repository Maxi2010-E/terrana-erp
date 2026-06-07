-- Terrana ERP Phase 8: logistics (customers, fumigation, truck agents, shipments)
-- Run in Supabase Dashboard → SQL Editor after 00033_operational_expense_description.sql

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.customer_status as enum ('active', 'inactive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.fumigation_requirement as enum (
    'requires_fumigation',
    'no_fumigation_required'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.shipment_status as enum ('loaded', 'in_transit', 'delivered');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.shipment_document_type as enum (
    'loading_video',
    'container_photo',
    'shipping_document',
    'fumigation_certificate'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  customer_code text not null unique,
  customer_name text not null,
  country text not null,
  contact_person text,
  phone text,
  email text,
  fumigation_requirement public.fumigation_requirement not null default 'requires_fumigation',
  status public.customer_status not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_status_idx on public.customers (status);
create index if not exists customers_name_idx on public.customers (customer_name);
create index if not exists customers_code_idx on public.customers (customer_code);

drop trigger if exists customers_updated_at on public.customers;
create trigger customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

create or replace function public.generate_customer_code()
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
        regexp_replace(customer_code, '^CUS-' || year_part || '-', ''),
        customer_code
      )::integer
    ),
    0
  ) + 1
  into next_num
  from public.customers
  where customer_code like 'CUS-' || year_part || '-%';

  return 'CUS-' || year_part || '-' || lpad(next_num::text, 6, '0');
end;
$$;

grant execute on function public.generate_customer_code() to authenticated;

create or replace function public.set_customer_code()
returns trigger
language plpgsql
as $$
begin
  if new.customer_code is null or new.customer_code = '' then
    new.customer_code := public.generate_customer_code();
  end if;
  return new;
end;
$$;

drop trigger if exists customers_set_code on public.customers;
create trigger customers_set_code
  before insert on public.customers
  for each row execute function public.set_customer_code();

-- ---------------------------------------------------------------------------
-- Fumigation chambers
-- ---------------------------------------------------------------------------
create table if not exists public.fumigation_chambers (
  id uuid primary key default gen_random_uuid(),
  facility_name text not null,
  address text,
  contact_person text,
  phone text,
  registration_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fumigation_chambers_name_idx
  on public.fumigation_chambers (facility_name);

drop trigger if exists fumigation_chambers_updated_at on public.fumigation_chambers;
create trigger fumigation_chambers_updated_at
  before update on public.fumigation_chambers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Truck agents
-- ---------------------------------------------------------------------------
create table if not exists public.truck_agents (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists truck_agents_name_idx on public.truck_agents (agent_name);

drop trigger if exists truck_agents_updated_at on public.truck_agents;
create trigger truck_agents_updated_at
  before update on public.truck_agents
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Shipments
-- ---------------------------------------------------------------------------
create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  shipment_number text not null unique,
  customer_id uuid not null references public.customers (id),
  truck_agent_id uuid references public.truck_agents (id),
  driver_name text,
  driver_phone text,
  truck_plate_number text,
  container_number text not null,
  seal_number text not null,
  destination_port text,
  total_kg numeric(12, 3) not null check (total_kg > 0),
  loading_date date not null default current_date,
  bill_of_lading text,
  vessel_name text,
  vessel_number text,
  status public.shipment_status not null default 'loaded',
  notes text,
  created_by uuid references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shipments_customer_idx on public.shipments (customer_id);
create index if not exists shipments_status_idx on public.shipments (status);
create index if not exists shipments_loading_date_idx
  on public.shipments (loading_date desc);
create index if not exists shipments_number_idx on public.shipments (shipment_number);

drop trigger if exists shipments_updated_at on public.shipments;
create trigger shipments_updated_at
  before update on public.shipments
  for each row execute function public.set_updated_at();

create or replace function public.generate_shipment_number()
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
        regexp_replace(shipment_number, '^SHP-' || year_part || '-', ''),
        shipment_number
      )::integer
    ),
    0
  ) + 1
  into next_num
  from public.shipments
  where shipment_number like 'SHP-' || year_part || '-%';

  return 'SHP-' || year_part || '-' || lpad(next_num::text, 6, '0');
end;
$$;

grant execute on function public.generate_shipment_number() to authenticated;

create or replace function public.set_shipment_number()
returns trigger
language plpgsql
as $$
begin
  if new.shipment_number is null or new.shipment_number = '' then
    new.shipment_number := public.generate_shipment_number();
  end if;
  return new;
end;
$$;

drop trigger if exists shipments_set_number on public.shipments;
create trigger shipments_set_number
  before insert on public.shipments
  for each row execute function public.set_shipment_number();

-- ---------------------------------------------------------------------------
-- Shipment inventory (allocation)
-- ---------------------------------------------------------------------------
create table if not exists public.shipment_inventory (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  inventory_batch_id uuid not null references public.inventory_batches (id),
  bags integer not null check (bags > 0),
  total_kg numeric(12, 3) not null check (total_kg > 0),
  created_at timestamptz not null default now(),
  constraint shipment_inventory_batch_unique unique (inventory_batch_id)
);

create index if not exists shipment_inventory_shipment_idx
  on public.shipment_inventory (shipment_id);

-- ---------------------------------------------------------------------------
-- Shipment documents (metadata; file upload deferred)
-- ---------------------------------------------------------------------------
create table if not exists public.shipment_documents (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  document_type public.shipment_document_type not null,
  file_path text,
  notes text,
  uploaded_by uuid references public.users (id),
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists shipment_documents_shipment_idx
  on public.shipment_documents (shipment_id);

-- ---------------------------------------------------------------------------
-- Link operational expenses to shipments
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'operational_expenses_shipment_id_fkey'
  ) then
    alter table public.operational_expenses
      add constraint operational_expenses_shipment_id_fkey
      foreign key (shipment_id) references public.shipments (id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Inventory allocation on shipment line insert
-- ---------------------------------------------------------------------------
create or replace function public.allocate_inventory_for_shipment()
returns trigger
language plpgsql
as $$
declare
  batch_status public.pre_stock_status;
begin
  select status
  into batch_status
  from public.inventory_batches
  where id = new.inventory_batch_id;

  if batch_status is distinct from 'available' then
    raise exception 'Inventory batch is not available for shipment allocation';
  end if;

  update public.inventory_batches
  set status = 'allocated'
  where id = new.inventory_batch_id;

  return new;
end;
$$;

drop trigger if exists shipment_inventory_allocate on public.shipment_inventory;
create trigger shipment_inventory_allocate
  after insert on public.shipment_inventory
  for each row execute function public.allocate_inventory_for_shipment();

-- Release inventory if shipment line removed before delivery
create or replace function public.release_inventory_from_shipment()
returns trigger
language plpgsql
as $$
begin
  update public.inventory_batches
  set status = 'available'
  where id = old.inventory_batch_id
    and status = 'allocated';

  return old;
end;
$$;

drop trigger if exists shipment_inventory_release on public.shipment_inventory;
create trigger shipment_inventory_release
  after delete on public.shipment_inventory
  for each row execute function public.release_inventory_from_shipment();

-- Mark inventory shipped when shipment delivered
create or replace function public.sync_inventory_on_shipment_status()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'delivered' and old.status is distinct from 'delivered' then
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

drop trigger if exists shipments_sync_inventory_status on public.shipments;
create trigger shipments_sync_inventory_status
  after update of status on public.shipments
  for each row execute function public.sync_inventory_on_shipment_status();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.customers enable row level security;
alter table public.fumigation_chambers enable row level security;
alter table public.truck_agents enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_inventory enable row level security;
alter table public.shipment_documents enable row level security;

drop policy if exists customers_select on public.customers;
create policy customers_select on public.customers
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'logistics_manager')
  );

drop policy if exists customers_insert on public.customers;
create policy customers_insert on public.customers
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin', 'logistics_manager')
  );

drop policy if exists customers_update on public.customers;
create policy customers_update on public.customers
  for update to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'logistics_manager')
  );

drop policy if exists fumigation_chambers_select on public.fumigation_chambers;
create policy fumigation_chambers_select on public.fumigation_chambers
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'logistics_manager')
  );

drop policy if exists fumigation_chambers_insert on public.fumigation_chambers;
create policy fumigation_chambers_insert on public.fumigation_chambers
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin', 'logistics_manager')
  );

drop policy if exists fumigation_chambers_update on public.fumigation_chambers;
create policy fumigation_chambers_update on public.fumigation_chambers
  for update to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'logistics_manager')
  );

drop policy if exists truck_agents_select on public.truck_agents;
create policy truck_agents_select on public.truck_agents
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'logistics_manager')
  );

drop policy if exists truck_agents_insert on public.truck_agents;
create policy truck_agents_insert on public.truck_agents
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin', 'logistics_manager')
  );

drop policy if exists truck_agents_update on public.truck_agents;
create policy truck_agents_update on public.truck_agents
  for update to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'logistics_manager')
  );

drop policy if exists shipments_select on public.shipments;
create policy shipments_select on public.shipments
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'logistics_manager')
  );

drop policy if exists shipments_insert on public.shipments;
create policy shipments_insert on public.shipments
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin', 'logistics_manager')
  );

drop policy if exists shipments_update on public.shipments;
create policy shipments_update on public.shipments
  for update to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'logistics_manager')
  );

drop policy if exists shipment_inventory_select on public.shipment_inventory;
create policy shipment_inventory_select on public.shipment_inventory
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'logistics_manager')
  );

drop policy if exists shipment_inventory_insert on public.shipment_inventory;
create policy shipment_inventory_insert on public.shipment_inventory
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin', 'logistics_manager')
  );

drop policy if exists shipment_inventory_delete on public.shipment_inventory;
create policy shipment_inventory_delete on public.shipment_inventory
  for delete to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'logistics_manager')
  );

drop policy if exists shipment_documents_select on public.shipment_documents;
create policy shipment_documents_select on public.shipment_documents
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'logistics_manager')
  );

drop policy if exists shipment_documents_insert on public.shipment_documents;
create policy shipment_documents_insert on public.shipment_documents
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin', 'logistics_manager')
  );

grant select, insert, update on public.customers to authenticated;
grant select, insert, update on public.fumigation_chambers to authenticated;
grant select, insert, update on public.truck_agents to authenticated;
grant select, insert, update on public.shipments to authenticated;
grant select, insert, delete on public.shipment_inventory to authenticated;
grant select, insert on public.shipment_documents to authenticated;
