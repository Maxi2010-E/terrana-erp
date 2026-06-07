-- Terrana ERP: waste re-processing (local market recovery) inside waste management

-- ---------------------------------------------------------------------------
-- Track consumption of primary waste from main processing sessions
-- ---------------------------------------------------------------------------
alter table public.waste_records
  add column if not exists reprocessed_kg numeric(12, 3) not null default 0
    check (reprocessed_kg >= 0);

alter table public.waste_records
  drop constraint if exists waste_records_reprocessed_lte_weight;

alter table public.waste_records
  add constraint waste_records_reprocessed_lte_weight
    check (reprocessed_kg <= weight_kg);

-- ---------------------------------------------------------------------------
-- Waste re-processing sessions (mirror processing_sessions)
-- ---------------------------------------------------------------------------
create table if not exists public.waste_reprocessing_sessions (
  id uuid primary key default gen_random_uuid(),
  session_number text not null unique,
  source_waste_record_id uuid references public.waste_records (id),
  source_byproduct_id uuid,
  waste_type public.waste_type not null,
  processing_date date not null default current_date,
  number_of_bags integer not null default 0 check (number_of_bags >= 0),
  kg_per_bag numeric(12, 3) check (kg_per_bag is null or kg_per_bag > 0),
  extra_kg numeric(12, 3) not null default 0 check (extra_kg >= 0),
  kg_sent numeric(12, 3) not null check (kg_sent > 0),
  input_kg numeric(12, 3) not null check (input_kg > 0),
  output_kg numeric(12, 3) check (output_kg >= 0),
  yield_pct numeric(8, 4) check (yield_pct >= 0),
  status public.processing_session_status not null default 'pending_approval',
  processed_by uuid references public.employees (id),
  created_by uuid references auth.users (id),
  approved_by uuid references auth.users (id),
  approved_at timestamptz,
  rejected_by uuid references auth.users (id),
  rejected_at timestamptz,
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (source_waste_record_id is not null and source_byproduct_id is null)
    or (source_waste_record_id is null and source_byproduct_id is not null)
  )
);

create index if not exists waste_reprocessing_sessions_source_record_idx
  on public.waste_reprocessing_sessions (source_waste_record_id);

create index if not exists waste_reprocessing_sessions_source_byproduct_idx
  on public.waste_reprocessing_sessions (source_byproduct_id);

create index if not exists waste_reprocessing_sessions_status_idx
  on public.waste_reprocessing_sessions (status);

create index if not exists waste_reprocessing_sessions_date_idx
  on public.waste_reprocessing_sessions (processing_date desc);

drop trigger if exists waste_reprocessing_sessions_updated_at
  on public.waste_reprocessing_sessions;
create trigger waste_reprocessing_sessions_updated_at
  before update on public.waste_reprocessing_sessions
  for each row execute function public.set_updated_at();

create or replace function public.generate_waste_reprocessing_session_number()
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
        regexp_replace(session_number, '^WRP-' || year_part || '-', ''),
        session_number
      )::integer
    ),
    0
  ) + 1
  into next_num
  from public.waste_reprocessing_sessions
  where session_number like 'WRP-' || year_part || '-%';

  return 'WRP-' || year_part || '-' || lpad(next_num::text, 3, '0');
end;
$$;

grant execute on function public.generate_waste_reprocessing_session_number()
  to authenticated;

create or replace function public.set_waste_reprocessing_session_number()
returns trigger
language plpgsql
as $$
begin
  if new.session_number is null or new.session_number = '' then
    new.session_number := public.generate_waste_reprocessing_session_number();
  end if;
  return new;
end;
$$;

drop trigger if exists waste_reprocessing_sessions_set_number
  on public.waste_reprocessing_sessions;
create trigger waste_reprocessing_sessions_set_number
  before insert on public.waste_reprocessing_sessions
  for each row execute function public.set_waste_reprocessing_session_number();

-- ---------------------------------------------------------------------------
-- Local-market clean output (one row per session)
-- ---------------------------------------------------------------------------
create table if not exists public.waste_reprocessing_outputs (
  id uuid primary key default gen_random_uuid(),
  waste_reprocessing_session_id uuid not null unique
    references public.waste_reprocessing_sessions (id) on delete cascade,
  product_label text not null,
  bags_produced integer not null check (bags_produced >= 0),
  kg_per_bag numeric(12, 3),
  extra_kg numeric(12, 3) not null default 0 check (extra_kg >= 0),
  total_kg numeric(12, 3) not null check (total_kg >= 0)
);

-- ---------------------------------------------------------------------------
-- Secondary waste from waste re-processing (can be re-processed again)
-- ---------------------------------------------------------------------------
create table if not exists public.waste_reprocessing_byproducts (
  id uuid primary key default gen_random_uuid(),
  waste_reprocessing_session_id uuid not null
    references public.waste_reprocessing_sessions (id) on delete cascade,
  waste_type public.waste_type not null,
  number_of_bags integer not null default 0 check (number_of_bags >= 0),
  kg_per_bag numeric(12, 3) check (kg_per_bag is null or kg_per_bag > 0),
  extra_kg numeric(12, 3) not null default 0 check (extra_kg >= 0),
  weight_kg numeric(12, 3) not null check (weight_kg >= 0),
  reprocessed_kg numeric(12, 3) not null default 0 check (reprocessed_kg >= 0),
  date_recorded date not null default current_date,
  unique (waste_reprocessing_session_id, waste_type),
  check (reprocessed_kg <= weight_kg)
);

create index if not exists waste_reprocessing_byproducts_session_idx
  on public.waste_reprocessing_byproducts (waste_reprocessing_session_id);

-- FK from sessions to byproducts (added after table exists)
alter table public.waste_reprocessing_sessions
  drop constraint if exists waste_reprocessing_sessions_source_byproduct_fkey;

alter table public.waste_reprocessing_sessions
  add constraint waste_reprocessing_sessions_source_byproduct_fkey
    foreign key (source_byproduct_id)
    references public.waste_reprocessing_byproducts (id);

-- ---------------------------------------------------------------------------
-- Local market stock (created when re-processing completes)
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.waste_local_stock_status as enum ('available', 'depleted');
exception when duplicate_object then null; end $$;

create table if not exists public.waste_local_stock (
  id uuid primary key default gen_random_uuid(),
  stock_number text not null unique,
  waste_reprocessing_session_id uuid not null unique
    references public.waste_reprocessing_sessions (id),
  source_waste_type public.waste_type not null,
  product_label text not null,
  bags integer not null default 0 check (bags >= 0),
  total_kg numeric(12, 3) not null check (total_kg > 0),
  date_received date not null default current_date,
  status public.waste_local_stock_status not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists waste_local_stock_updated_at on public.waste_local_stock;
create trigger waste_local_stock_updated_at
  before update on public.waste_local_stock
  for each row execute function public.set_updated_at();

create or replace function public.generate_waste_local_stock_number()
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
        regexp_replace(stock_number, '^WLS-' || year_part || '-', ''),
        stock_number
      )::integer
    ),
    0
  ) + 1
  into next_num
  from public.waste_local_stock
  where stock_number like 'WLS-' || year_part || '-%';

  return 'WLS-' || year_part || '-' || lpad(next_num::text, 3, '0');
end;
$$;

grant execute on function public.generate_waste_local_stock_number() to authenticated;

create or replace function public.set_waste_local_stock_number()
returns trigger
language plpgsql
as $$
begin
  if new.stock_number is null or new.stock_number = '' then
    new.stock_number := public.generate_waste_local_stock_number();
  end if;
  return new;
end;
$$;

drop trigger if exists waste_local_stock_set_number on public.waste_local_stock;
create trigger waste_local_stock_set_number
  before insert on public.waste_local_stock
  for each row execute function public.set_waste_local_stock_number();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.waste_reprocessing_sessions enable row level security;
alter table public.waste_reprocessing_outputs enable row level security;
alter table public.waste_reprocessing_byproducts enable row level security;
alter table public.waste_local_stock enable row level security;

drop policy if exists waste_reprocessing_sessions_select on public.waste_reprocessing_sessions;
create policy waste_reprocessing_sessions_select on public.waste_reprocessing_sessions
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts', 'inventory_manager')
  );

drop policy if exists waste_reprocessing_sessions_insert on public.waste_reprocessing_sessions;
create policy waste_reprocessing_sessions_insert on public.waste_reprocessing_sessions
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin', 'accounts', 'inventory_manager')
  );

drop policy if exists waste_reprocessing_sessions_update on public.waste_reprocessing_sessions;
create policy waste_reprocessing_sessions_update on public.waste_reprocessing_sessions
  for update to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts', 'inventory_manager')
  );

drop policy if exists waste_reprocessing_outputs_select on public.waste_reprocessing_outputs;
create policy waste_reprocessing_outputs_select on public.waste_reprocessing_outputs
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts', 'inventory_manager')
  );

drop policy if exists waste_reprocessing_outputs_insert on public.waste_reprocessing_outputs;
create policy waste_reprocessing_outputs_insert on public.waste_reprocessing_outputs
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin', 'accounts', 'inventory_manager')
  );

drop policy if exists waste_reprocessing_outputs_update on public.waste_reprocessing_outputs;
create policy waste_reprocessing_outputs_update on public.waste_reprocessing_outputs
  for update to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts', 'inventory_manager')
  );

drop policy if exists waste_reprocessing_byproducts_select on public.waste_reprocessing_byproducts;
create policy waste_reprocessing_byproducts_select on public.waste_reprocessing_byproducts
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts', 'inventory_manager')
  );

drop policy if exists waste_reprocessing_byproducts_insert on public.waste_reprocessing_byproducts;
create policy waste_reprocessing_byproducts_insert on public.waste_reprocessing_byproducts
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin', 'accounts', 'inventory_manager')
  );

drop policy if exists waste_reprocessing_byproducts_update on public.waste_reprocessing_byproducts;
create policy waste_reprocessing_byproducts_update on public.waste_reprocessing_byproducts
  for update to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts', 'inventory_manager')
  );

drop policy if exists waste_local_stock_select on public.waste_local_stock;
create policy waste_local_stock_select on public.waste_local_stock
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts', 'inventory_manager')
  );

drop policy if exists waste_local_stock_insert on public.waste_local_stock;
create policy waste_local_stock_insert on public.waste_local_stock
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin', 'accounts', 'inventory_manager')
  );

drop policy if exists waste_local_stock_update on public.waste_local_stock;
create policy waste_local_stock_update on public.waste_local_stock
  for update to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'accounts', 'inventory_manager')
  );

grant select, insert, update on public.waste_reprocessing_sessions to authenticated;
grant select, insert, update on public.waste_reprocessing_outputs to authenticated;
grant select, insert, update, delete on public.waste_reprocessing_byproducts to authenticated;
grant select, insert, update on public.waste_local_stock to authenticated;
