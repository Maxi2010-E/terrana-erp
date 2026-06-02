-- Terrana ERP Phase 4: processing sessions, outputs, waste, pre-stock
-- Run in Supabase Dashboard → SQL Editor after 00008_procurement_batch_number_padding.sql

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.processing_session_status as enum ('in_progress', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.waste_type as enum (
    'broken_flower',
    'flower_bulb',
    'fungus',
    'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.pre_stock_source_type as enum ('procurement', 'processing');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.pre_stock_status as enum ('available', 'reserved', 'allocated', 'shipped');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Procurement: batch processing lifecycle
-- ---------------------------------------------------------------------------
alter table public.procurement_batches
  add column if not exists processing_closed boolean not null default false;

create index if not exists procurement_batches_processing_queue_idx
  on public.procurement_batches (status, quality_decision, processing_closed);

-- Inventory managers need read access to approved batches in the processing queue.
drop policy if exists procurement_batches_select on public.procurement_batches;
create policy procurement_batches_select on public.procurement_batches
  for select to authenticated
  using (
    public.current_app_role() in (
      'super_admin',
      'admin',
      'accounts',
      'inventory_manager'
    )
  );

-- ---------------------------------------------------------------------------
-- Processing sessions
-- ---------------------------------------------------------------------------
create table if not exists public.processing_sessions (
  id uuid primary key default gen_random_uuid(),
  session_number text not null unique,
  source_batch_id uuid not null references public.procurement_batches (id),
  processing_date date not null default current_date,
  bags_sent integer not null check (bags_sent > 0),
  input_kg numeric(12, 3) not null check (input_kg > 0),
  output_kg numeric(12, 3) check (output_kg >= 0),
  yield_pct numeric(8, 4) check (yield_pct >= 0),
  status public.processing_session_status not null default 'in_progress',
  processed_by uuid references public.employees (id),
  created_by uuid references auth.users (id),
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists processing_sessions_batch_idx
  on public.processing_sessions (source_batch_id);

create index if not exists processing_sessions_status_idx
  on public.processing_sessions (status);

create index if not exists processing_sessions_date_idx
  on public.processing_sessions (processing_date desc);

drop trigger if exists processing_sessions_updated_at on public.processing_sessions;
create trigger processing_sessions_updated_at
  before update on public.processing_sessions
  for each row execute function public.set_updated_at();

create or replace function public.generate_processing_session_number()
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
        regexp_replace(session_number, '^PS-' || year_part || '-', ''),
        session_number
      )::integer
    ),
    0
  ) + 1
  into next_num
  from public.processing_sessions
  where session_number like 'PS-' || year_part || '-%';

  return 'PS-' || year_part || '-' || lpad(next_num::text, 3, '0');
end;
$$;

grant execute on function public.generate_processing_session_number() to authenticated;

create or replace function public.set_processing_session_number()
returns trigger
language plpgsql
as $$
begin
  if new.session_number is null or new.session_number = '' then
    new.session_number := public.generate_processing_session_number();
  end if;
  return new;
end;
$$;

drop trigger if exists processing_sessions_set_number on public.processing_sessions;
create trigger processing_sessions_set_number
  before insert on public.processing_sessions
  for each row execute function public.set_processing_session_number();

-- ---------------------------------------------------------------------------
-- Processing outputs (one row per session)
-- ---------------------------------------------------------------------------
create table if not exists public.processing_outputs (
  id uuid primary key default gen_random_uuid(),
  processing_session_id uuid not null unique
    references public.processing_sessions (id) on delete cascade,
  bags_produced integer not null check (bags_produced >= 0),
  kg_per_bag numeric(12, 3),
  extra_kg numeric(12, 3) not null default 0 check (extra_kg >= 0),
  total_kg numeric(12, 3) not null check (total_kg >= 0)
);

-- ---------------------------------------------------------------------------
-- Waste records
-- ---------------------------------------------------------------------------
create table if not exists public.waste_records (
  id uuid primary key default gen_random_uuid(),
  processing_session_id uuid not null
    references public.processing_sessions (id) on delete cascade,
  waste_type public.waste_type not null,
  weight_kg numeric(12, 3) not null check (weight_kg >= 0),
  date_recorded date not null default current_date,
  unique (processing_session_id, waste_type)
);

create index if not exists waste_records_session_idx
  on public.waste_records (processing_session_id);

-- ---------------------------------------------------------------------------
-- Pre-stock (created when processing completes)
-- ---------------------------------------------------------------------------
create table if not exists public.pre_stock (
  id uuid primary key default gen_random_uuid(),
  pre_stock_number text not null unique,
  source_type public.pre_stock_source_type not null,
  source_id uuid not null,
  product_type text not null,
  bags integer not null default 0 check (bags >= 0),
  total_kg numeric(12, 3) not null check (total_kg > 0),
  date_received date not null default current_date,
  status public.pre_stock_status not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pre_stock_source_idx
  on public.pre_stock (source_type, source_id);

drop trigger if exists pre_stock_updated_at on public.pre_stock;
create trigger pre_stock_updated_at
  before update on public.pre_stock
  for each row execute function public.set_updated_at();

create or replace function public.generate_pre_stock_number()
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
        regexp_replace(pre_stock_number, '^PSK-' || year_part || '-', ''),
        pre_stock_number
      )::integer
    ),
    0
  ) + 1
  into next_num
  from public.pre_stock
  where pre_stock_number like 'PSK-' || year_part || '-%';

  return 'PSK-' || year_part || '-' || lpad(next_num::text, 3, '0');
end;
$$;

grant execute on function public.generate_pre_stock_number() to authenticated;

create or replace function public.set_pre_stock_number()
returns trigger
language plpgsql
as $$
begin
  if new.pre_stock_number is null or new.pre_stock_number = '' then
    new.pre_stock_number := public.generate_pre_stock_number();
  end if;
  return new;
end;
$$;

drop trigger if exists pre_stock_set_number on public.pre_stock;
create trigger pre_stock_set_number
  before insert on public.pre_stock
  for each row execute function public.set_pre_stock_number();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.processing_sessions enable row level security;
alter table public.processing_outputs enable row level security;
alter table public.waste_records enable row level security;
alter table public.pre_stock enable row level security;

drop policy if exists processing_sessions_select on public.processing_sessions;
create policy processing_sessions_select on public.processing_sessions
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'inventory_manager')
  );

drop policy if exists processing_sessions_insert on public.processing_sessions;
create policy processing_sessions_insert on public.processing_sessions
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin', 'inventory_manager')
  );

drop policy if exists processing_sessions_update on public.processing_sessions;
create policy processing_sessions_update on public.processing_sessions
  for update to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'inventory_manager')
  );

drop policy if exists processing_outputs_select on public.processing_outputs;
create policy processing_outputs_select on public.processing_outputs
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'inventory_manager')
  );

drop policy if exists processing_outputs_insert on public.processing_outputs;
create policy processing_outputs_insert on public.processing_outputs
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin', 'inventory_manager')
  );

drop policy if exists processing_outputs_update on public.processing_outputs;
create policy processing_outputs_update on public.processing_outputs
  for update to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'inventory_manager')
  );

drop policy if exists waste_records_select on public.waste_records;
create policy waste_records_select on public.waste_records
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'inventory_manager')
  );

drop policy if exists waste_records_insert on public.waste_records;
create policy waste_records_insert on public.waste_records
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin', 'inventory_manager')
  );

drop policy if exists waste_records_update on public.waste_records;
create policy waste_records_update on public.waste_records
  for update to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'inventory_manager')
  );

drop policy if exists waste_records_delete on public.waste_records;
create policy waste_records_delete on public.waste_records
  for delete to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'inventory_manager')
  );

drop policy if exists pre_stock_select on public.pre_stock;
create policy pre_stock_select on public.pre_stock
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'inventory_manager')
  );

drop policy if exists pre_stock_insert on public.pre_stock;
create policy pre_stock_insert on public.pre_stock
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin', 'inventory_manager')
  );

drop policy if exists pre_stock_update on public.pre_stock;
create policy pre_stock_update on public.pre_stock
  for update to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'inventory_manager')
  );

grant select, insert, update on public.processing_sessions to authenticated;
grant select, insert, update on public.processing_outputs to authenticated;
grant select, insert, update, delete on public.waste_records to authenticated;
grant select, insert, update on public.pre_stock to authenticated;
