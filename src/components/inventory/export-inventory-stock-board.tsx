import { ProductTypeBadge } from "@/components/procurement/product-type-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExportInventoryStockBoard } from "@/lib/inventory/types";
import { cn } from "@/lib/utils";

type ExportInventoryStockBoardProps = {
  board: ExportInventoryStockBoard;
};

function formatKg(kg: number): string {
  return kg.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

export function ExportInventoryStockBoardPanel({
  board,
}: ExportInventoryStockBoardProps) {
  const { lines, total_batches, total_bags, total_kg } = board;
  const hasStock = lines.length > 0;

  return (
    <Card className="rounded-2xl border-border/70 shadow-sm">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="text-base">Available export stock</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              On-hand batches by graded product type (status available).
            </p>
          </div>
          {hasStock ? (
            <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm tabular-nums">
              <div>
                <dt className="text-muted-foreground">Total bags</dt>
                <dd className="text-lg font-semibold text-foreground">
                  {total_bags.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Total kg</dt>
                <dd className="text-lg font-semibold text-foreground">
                  {formatKg(total_kg)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Batches</dt>
                <dd className="text-lg font-semibold text-foreground">
                  {total_batches.toLocaleString()}
                </dd>
              </div>
            </dl>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="px-4 py-5">
        {!hasStock ? (
          <p className="text-sm text-muted-foreground">
            No export inventory on hand. Grade pre-stock to create available
            batches.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {lines.map((line) => (
              <div
                key={line.product_type}
                className={cn(
                  "flex min-h-[6.5rem] flex-col rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] p-3 shadow-sm",
                )}
              >
                <ProductTypeBadge
                  productType={line.product_type}
                  className="w-fit max-w-full"
                />
                <p className="mt-3 text-2xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
                  {line.bags.toLocaleString()}
                  <span className="ml-1.5 text-sm font-medium text-muted-foreground">
                    bag{line.bags === 1 ? "" : "s"}
                  </span>
                </p>
                <p className="mt-1.5 text-sm tabular-nums text-muted-foreground">
                  {formatKg(line.total_kg)} kg
                  {line.batch_count > 1
                    ? ` · ${line.batch_count.toLocaleString()} batches`
                    : line.batch_count === 1
                      ? " · 1 batch"
                      : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
