-- Terrana ERP Phase 4: optional extra kg on waste records

alter table public.waste_records
  add column if not exists extra_kg numeric(12, 3) not null default 0
    check (extra_kg >= 0);
