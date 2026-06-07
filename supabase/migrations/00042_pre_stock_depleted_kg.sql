-- Allow fully graded pre-stock (0 bags remaining, 0 kg on hand).
-- Still require total_kg > 0 while any bags remain in the room.

alter table public.pre_stock
  drop constraint if exists pre_stock_total_kg_check;

alter table public.pre_stock
  add constraint pre_stock_total_kg_check
  check (total_kg >= 0 and (bags = 0 or total_kg > 0));
