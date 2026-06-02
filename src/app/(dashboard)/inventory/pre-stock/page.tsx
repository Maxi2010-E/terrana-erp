import { PreStockTable } from "@/components/inventory/pre-stock-table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { getPreStockList } from "@/lib/actions/inventory";
import { requireInventoryRead } from "@/lib/auth/require-role";
import {
  INVENTORY_STATUSES,
  INVENTORY_STATUS_LABELS,
  type InventoryStatus,
} from "@/lib/inventory/constants";

type PreStockPageProps = {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
};

function recordLabel(total: number): string {
  if (total === 0) {
    return "No records yet";
  }
  if (total === 1) {
    return "1 record";
  }
  return `${total.toLocaleString()} records`;
}

export default async function PreStockPage({ searchParams }: PreStockPageProps) {
  await requireInventoryRead();
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const query = params.q ?? "";
  const statusParam = params.status ?? "all";
  const statusFilter = INVENTORY_STATUSES.includes(statusParam as InventoryStatus)
    ? (statusParam as InventoryStatus)
    : "all";

  const { rows, total } = await getPreStockList(page, query, statusFilter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pre-stock"
        meta={recordLabel(total)}
        description="Goods awaiting grading into export inventory. From processing output or clean on-site procurement marked pre-stock."
        actions={
          <LinkButton href="/inventory/export/new" size="lg">
            Grade to export inventory
          </LinkButton>
        }
      />

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="gap-4 border-b border-border/60 pb-4">
          <form className="flex flex-wrap items-end gap-3" method="get">
            <div className="flex min-w-[220px] flex-1 flex-col gap-2">
              <label htmlFor="q" className="text-sm font-medium">
                Search
              </label>
              <input
                id="q"
                name="q"
                defaultValue={query}
                placeholder="Pre-stock number or product…"
                className="flex h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="flex min-w-[160px] flex-col gap-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={statusFilter}
                className="flex h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="all">All statuses</option>
                {INVENTORY_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {INVENTORY_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="outline">
              Apply
            </Button>
          </form>
        </CardHeader>
        <CardContent className="space-y-5 px-4 pb-6 pt-5">
          <PreStockTable rows={rows} />
          <PaginationBar
            page={page}
            total={total}
            pathname="/inventory/pre-stock"
            query={{
              q: query || undefined,
              status: statusFilter !== "all" ? statusFilter : undefined,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
