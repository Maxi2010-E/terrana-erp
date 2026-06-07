-- Terrana ERP Phase 5: export inventory (inventory batches + pre-stock sources)

create table if not exists public.inventory_batches (
  id uuid primary key default gen_random_uuid(),
  inventory_number text not null unique,
  product_type text not null,
  bags integer not null default 0 check (bags >= 0),
  total_kg numeric(12, 3) not null check (total_kg > 0),
  date_graded date not null default current_date,
  status public.pre_stock_status not null default 'available',
  notes text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inventory_batches_status_idx
  on public.inventory_batches (status, date_graded desc);

create index if not exists inventory_batches_product_idx
  on public.inventory_batches (product_type);

drop trigger if exists inventory_batches_updated_at on public.inventory_batches;
create trigger inventory_batches_updated_at
  before update on public.inventory_batches
  for each row execute function public.set_updated_at();

create or replace function public.generate_inventory_number()
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
        regexp_replace(inventory_number, '^INV-' || year_part || '-', ''),
        inventory_number
      )::integer
    ),
    0
  ) + 1
  into next_num
  from public.inventory_batches
  where inventory_number like 'INV-' || year_part || '-%';

  return 'INV-' || year_part || '-' || lpad(next_num::text, 6, '0');
end;
$$;

grant execute on function public.generate_inventory_number() to authenticated;

create or replace function public.set_inventory_number()
returns trigger
language plpgsql
as $$
begin
  if new.inventory_number is null or new.inventory_number = '' then
    new.inventory_number := public.generate_inventory_number();
  end if;
  return new;
end;
$$;

drop trigger if exists inventory_batches_set_number on public.inventory_batches;
create trigger inventory_batches_set_number
  before insert on public.inventory_batches
  for each row execute function public.set_inventory_number();

create table if not exists public.inventory_sources (
  id uuid primary key default gen_random_uuid(),
  inventory_batch_id uuid not null
    references public.inventory_batches (id) on delete cascade,
  pre_stock_id uuid not null
    references public.pre_stock (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (inventory_batch_id, pre_stock_id),
  unique (pre_stock_id)
);

create index if not exists inventory_sources_batch_idx
  on public.inventory_sources (inventory_batch_id);

alter table public.inventory_batches enable row level security;
alter table public.inventory_sources enable row level security;

drop policy if exists inventory_batches_select on public.inventory_batches;
create policy inventory_batches_select on public.inventory_batches
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'inventory_manager')
  );

drop policy if exists inventory_batches_insert on public.inventory_batches;
create policy inventory_batches_insert on public.inventory_batches
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin', 'inventory_manager')
  );

drop policy if exists inventory_batches_update on public.inventory_batches;
create policy inventory_batches_update on public.inventory_batches
  for update to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'inventory_manager')
  );

drop policy if exists inventory_sources_select on public.inventory_sources;
create policy inventory_sources_select on public.inventory_sources
  for select to authenticated
  using (
    public.current_app_role() in ('super_admin', 'admin', 'inventory_manager')
  );

drop policy if exists inventory_sources_insert on public.inventory_sources;
create policy inventory_sources_insert on public.inventory_sources
  for insert to authenticated
  with check (
    public.current_app_role() in ('super_admin', 'admin', 'inventory_manager')
  );

grant select, insert, update on public.inventory_batches to authenticated;
grant select, insert on public.inventory_sources to authenticated;
