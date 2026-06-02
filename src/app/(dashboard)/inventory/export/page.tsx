import { InventoryBatchTable } from "@/components/inventory/inventory-batch-table";
import { InventoryMixViewSwitch } from "@/components/inventory/inventory-mix-view-switch";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { getInventoryBatchesList } from "@/lib/actions/inventory";
import { requireInventoryRead } from "@/lib/auth/require-role";

type ExportInventoryPageProps = {
  searchParams: Promise<{ page?: string; q?: string; message?: string; mix?: string }>;
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
  const showMixDetails = params.mix === "1";
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
        <CardHeader className="gap-4 border-b border-border/60 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <form className="flex w-full max-w-md gap-2">
              <input
                name="q"
                defaultValue={query}
                placeholder="Search by inventory number or product…"
                className="flex h-10 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              {showMixDetails ? (
                <input type="hidden" name="mix" value="1" />
              ) : null}
              <Button type="submit" variant="outline">
                Search
              </Button>
            </form>

            <InventoryMixViewSwitch
              showMixDetails={showMixDetails}
              query={query || undefined}
              page={page}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-5 px-4 pb-6 pt-5">
          <InventoryBatchTable rows={rows} showMixDetails={showMixDetails} />

          <PaginationBar
            page={page}
            total={total}
            pathname="/inventory/export"
            query={{
              q: query || undefined,
              mix: showMixDetails ? "1" : undefined,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
