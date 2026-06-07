import Link from "next/link";

import { ProductTypeBadge } from "@/components/procurement/product-type-badge";
import { buttonVariants } from "@/components/ui/button";
import type { ProcessingQueueRow } from "@/lib/processing/types";
import { formatProcurementBatchNumber } from "@/lib/procurement/batch-number";
import { cn } from "@/lib/utils";

const HEAD_CELL =
  "px-4 pb-3 pt-1 text-left text-xs font-medium tracking-wide uppercase";
const BODY_CELL = "px-4 py-4 align-middle leading-normal";

export function ProcessingQueueTable({ rows }: { rows: ProcessingQueueRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border/60 text-muted-foreground">
            <th className={HEAD_CELL}>Batch</th>
            <th className={HEAD_CELL}>Product</th>
            <th className={HEAD_CELL}>Supplier</th>
            <th className={HEAD_CELL}>Remaining bags</th>
            <th className={HEAD_CELL}>Total KG</th>
            <th className={HEAD_CELL}>Date</th>
            <th className={`${HEAD_CELL} w-32`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-10 text-center text-muted-foreground"
              >
                No batches waiting for processing.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border/50 last:border-0"
              >
                <td className={`${BODY_CELL} whitespace-nowrap font-medium tabular-nums`}>
                  {formatProcurementBatchNumber(row.batch_number)}
                </td>
                <td className={BODY_CELL}>
                  <ProductTypeBadge productType={row.product_type} />
                </td>
                <td className={BODY_CELL}>{row.supplier_name}</td>
                <td className={`${BODY_CELL} tabular-nums`}>
                  {row.bags_remaining.toLocaleString()} /{" "}
                  {row.number_of_bags.toLocaleString()}
                </td>
                <td className={`${BODY_CELL} tabular-nums`}>
                  {row.total_kg.toLocaleString()}
                </td>
                <td
                  className={`${BODY_CELL} whitespace-nowrap tabular-nums text-muted-foreground`}
                >
                  {row.procurement_date}
                </td>
                <td className={BODY_CELL}>
                  <Link
                    href={`/processing/new?batch=${row.id}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                    )}
                  >
                    Start
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
