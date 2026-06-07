import { ProductTypeBadge } from "@/components/procurement/product-type-badge";
import { ProcessingStatusBadge } from "@/components/processing/processing-status-badge";
import { TableViewAction } from "@/components/ui/table-view-action";
import type { ProcessingSessionListRow } from "@/lib/processing/types";
import type { ProcessingSessionStatus } from "@/lib/processing/constants";

const HEAD_CELL =
  "px-4 pb-3 pt-1 text-left text-xs font-medium tracking-wide uppercase";
const BODY_CELL = "px-4 py-4 align-middle leading-normal";

export function ProcessingSessionsTable({
  rows,
}: {
  rows: ProcessingSessionListRow[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border/60 text-muted-foreground">
            <th className={HEAD_CELL}>Session</th>
            <th className={HEAD_CELL}>Batch</th>
            <th className={HEAD_CELL}>Product</th>
            <th className={HEAD_CELL}>Bags sent</th>
            <th className={HEAD_CELL}>Input KG</th>
            <th className={HEAD_CELL}>Output KG</th>
            <th className={HEAD_CELL}>Yield</th>
            <th className={HEAD_CELL}>Status</th>
            <th className={HEAD_CELL}>Date</th>
            <th className={`${HEAD_CELL} w-24`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={10}
                className="px-4 py-10 text-center text-muted-foreground"
              >
                No processing sessions yet.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border/50 last:border-0"
              >
                <td className={`${BODY_CELL} whitespace-nowrap font-medium tabular-nums`}>
                  {row.session_number}
                </td>
                <td className={`${BODY_CELL} whitespace-nowrap tabular-nums`}>
                  {row.batch_number}
                </td>
                <td className={BODY_CELL}>
                  <ProductTypeBadge productType={row.product_type} />
                </td>
                <td className={`${BODY_CELL} tabular-nums`}>
                  {row.bags_sent.toLocaleString()}
                </td>
                <td className={`${BODY_CELL} tabular-nums`}>
                  {row.input_kg.toLocaleString()}
                </td>
                <td className={`${BODY_CELL} tabular-nums`}>
                  {row.output_kg != null
                    ? row.output_kg.toLocaleString()
                    : "—"}
                </td>
                <td className={`${BODY_CELL} tabular-nums`}>
                  {row.yield_pct != null ? `${row.yield_pct}%` : "—"}
                </td>
                <td className={BODY_CELL}>
                  <ProcessingStatusBadge
                    status={row.status as ProcessingSessionStatus}
                  />
                </td>
                <td
                  className={`${BODY_CELL} whitespace-nowrap tabular-nums text-muted-foreground`}
                >
                  {row.processing_date}
                </td>
                <td className={BODY_CELL}>
                  <TableViewAction href={`/processing/${row.id}`} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
