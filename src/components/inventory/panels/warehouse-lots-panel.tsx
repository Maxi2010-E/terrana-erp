import { WarehouseLotTable } from "@/components/inventory/warehouse-lot-table";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { getWarehouseLotsList } from "@/lib/actions/warehouse-lots";

type WarehouseLotsPanelProps = {
  page: number;
  query: string;
};

export async function WarehouseLotsPanel({ page, query }: WarehouseLotsPanelProps) {
  const { rows, total } = await getWarehouseLotsList(page, query);

  return (
    <div className="space-y-0">
      <p className="border-b border-border/60 px-4 py-4 text-sm text-muted-foreground">
        Physical stack locations for export inventory before container loading.
      </p>
      <div className="space-y-5 px-4 py-5">
        <WarehouseLotTable rows={rows} />
        <PaginationBar
          page={page}
          total={total}
          pathname="/inventory"
          query={{
            tab: "warehouse_lots",
            q: query || undefined,
          }}
        />
      </div>
    </div>
  );
}
