import { PreStockTable } from "@/components/inventory/pre-stock-table";
import { Button } from "@/components/ui/button";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { getPreStockList } from "@/lib/actions/inventory";
import {
  INVENTORY_STATUSES,
  INVENTORY_STATUS_LABELS,
  type InventoryStatus,
} from "@/lib/inventory/constants";

type PreStockPanelProps = {
  page: number;
  query: string;
  status?: string;
};

export async function PreStockPanel({ page, query, status }: PreStockPanelProps) {
  const statusParam = status ?? "all";
  const statusFilter = INVENTORY_STATUSES.includes(statusParam as InventoryStatus)
    ? (statusParam as InventoryStatus)
    : "all";

  const { rows, total } = await getPreStockList(page, query, statusFilter);

  return (
    <div className="space-y-0">
      <p className="border-b border-border/60 px-4 py-4 text-sm text-muted-foreground">
        Goods awaiting grading into export inventory. From processing output or clean
        on-site procurement marked pre-stock.
      </p>
      <div className="border-b border-border/60 px-4 py-4">
        <form className="flex flex-wrap items-end gap-3" method="get" action="/inventory">
          <input type="hidden" name="tab" value="pre_stock" />
          {query ? <input type="hidden" name="q" value={query} /> : null}
          <div className="flex min-w-[160px] flex-col gap-2">
            <label htmlFor="pre-stock-status" className="text-sm font-medium">
              Status
            </label>
            <select
              id="pre-stock-status"
              name="status"
              defaultValue={statusFilter}
              className="flex h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="all">All statuses</option>
              {INVENTORY_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {INVENTORY_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="outline">
            Apply
          </Button>
        </form>
      </div>
      <div className="space-y-5 px-4 py-5">
        <PreStockTable rows={rows} />
        <PaginationBar
          page={page}
          total={total}
          pathname="/inventory"
          query={{
            tab: "pre_stock",
            q: query || undefined,
            status: statusFilter !== "all" ? statusFilter : undefined,
          }}
        />
      </div>
    </div>
  );
}
