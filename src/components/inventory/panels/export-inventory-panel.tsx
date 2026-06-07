import { ExportInventoryStockBoardPanel } from "@/components/inventory/export-inventory-stock-board";
import { InventoryBatchTable } from "@/components/inventory/inventory-batch-table";
import { InventoryMixViewSwitch } from "@/components/inventory/inventory-mix-view-switch";
import { Button } from "@/components/ui/button";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  getExportInventoryAvailableStockBoard,
  getInventoryBatchesList,
} from "@/lib/actions/inventory";
import { getWarehouseLotsForAssignPicker } from "@/lib/actions/warehouse-lots";

type ExportInventoryPanelProps = {
  page: number;
  query: string;
  showMixDetails: boolean;
  gradedFrom?: string;
  gradedTo?: string;
};

export async function ExportInventoryPanel({
  page,
  query,
  showMixDetails,
  gradedFrom,
  gradedTo,
}: ExportInventoryPanelProps) {
  const [{ rows, total }, stockBoard, warehouseLots] = await Promise.all([
    getInventoryBatchesList(page, query, { gradedFrom, gradedTo }),
    getExportInventoryAvailableStockBoard(),
    getWarehouseLotsForAssignPicker(),
  ]);

  return (
    <div className="space-y-0">
      <p className="border-b border-border/60 px-4 py-4 text-sm text-muted-foreground">
        Graded, export-ready inventory batches created from pre-stock. Assign warehouse
        lots before loading containers.
      </p>
      <div className="border-b border-border/60 px-4 py-4">
        <ExportInventoryStockBoardPanel board={stockBoard} />
      </div>
      <div className="border-b border-border/60 px-4 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <form className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end" method="get" action="/inventory">
            <input type="hidden" name="tab" value="export" />
            {query ? <input type="hidden" name="q" value={query} /> : null}
            {showMixDetails ? <input type="hidden" name="mix" value="1" /> : null}
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                Graded from
                <input
                  name="graded_from"
                  type="date"
                  defaultValue={gradedFrom ?? ""}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                Graded to
                <input
                  name="graded_to"
                  type="date"
                  defaultValue={gradedTo ?? ""}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </label>
              <Button type="submit" variant="outline">
                Apply dates
              </Button>
            </div>
          </form>
          <InventoryMixViewSwitch
            showMixDetails={showMixDetails}
            query={query || undefined}
            page={page}
            gradedFrom={gradedFrom}
            gradedTo={gradedTo}
          />
        </div>
      </div>
      <div className="space-y-5 px-4 py-5">
        <InventoryBatchTable
          rows={rows}
          showMixDetails={showMixDetails}
          warehouseLots={warehouseLots}
        />
        <PaginationBar
          page={page}
          total={total}
          pathname="/inventory"
          query={{
            tab: "export",
            q: query || undefined,
            mix: showMixDetails ? "1" : undefined,
            graded_from: gradedFrom,
            graded_to: gradedTo,
          }}
        />
      </div>
    </div>
  );
}
