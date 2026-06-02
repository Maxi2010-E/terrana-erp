-- Shorter procurement batch numbers: PR-YYYY-001 (was PR-YYYY-000001)
create or replace function public.generate_procurement_batch_number()
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
        regexp_replace(batch_number, '^PR-' || year_part || '-', ''),
        batch_number
      )::integer
    ),
    0
  ) + 1
  into next_num
  from public.procurement_batches
  where batch_number like 'PR-' || year_part || '-%';

  return 'PR-' || year_part || '-' || lpad(next_num::text, 3, '0');
end;
$$;
