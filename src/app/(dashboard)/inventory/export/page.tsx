import { InventoryBatchTable } from "@/components/inventory/inventory-batch-table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { getInventoryBatchesList } from "@/lib/actions/inventory";
import { requireInventoryRead } from "@/lib/auth/require-role";

type ExportInventoryPageProps = {
  searchParams: Promise<{ page?: string; q?: string; message?: string }>;
};

function recordLabel(total: number): string {
  if (total === 0) {
    return "No batches yet";
  }
  if (total === 1) {
    return "1 batch";
  }
  return `${total.toLocaleString()} batches`;
}

function successMessage(message: string | undefined): string | null {
  if (message === "created") {
    return "Export inventory batch created successfully.";
  }
  return null;
}

export default async function ExportInventoryPage({
  searchParams,
}: ExportInventoryPageProps) {
  await requireInventoryRead();
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const query = params.q ?? "";
  const flash = successMessage(params.message);
  const { rows, total } = await getInventoryBatchesList(page, query);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Export inventory"
        meta={recordLabel(total)}
        description="Graded, export-ready inventory batches created from pre-stock."
        actions={
          <LinkButton href="/inventory/export/new" size="lg">
            Create inventory batch
          </LinkButton>
        }
      />

      {flash ? (
        <p
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200"
          role="status"
        >
          {flash}
        </p>
      ) : null}

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <form className="flex max-w-md gap-2" method="get">
            <input
              name="q"
              defaultValue={query}
              placeholder="Search by inventory number or product…"
              className="flex h-10 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
        </CardHeader>
        <CardContent className="space-y-5 px-4 pb-6 pt-5">
          <InventoryBatchTable rows={rows} />
          <PaginationBar
            page={page}
            total={total}
            pathname="/inventory/export"
            query={{ q: query || undefined }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
