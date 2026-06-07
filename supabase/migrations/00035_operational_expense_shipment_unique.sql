-- One warehouse loading expense per shipment.

create unique index if not exists operational_expenses_warehouse_loading_shipment_unique
  on public.operational_expenses (shipment_id)
  where expense_type = 'warehouse_loading'
    and shipment_id is not null
    and status in ('pending_approval', 'approved');
