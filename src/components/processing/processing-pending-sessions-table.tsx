import { ProductTypeBadge } from "@/components/procurement/product-type-badge";
import { TableViewAction } from "@/components/ui/table-view-action";
import type { ProcessingPendingSessionRow } from "@/lib/processing/types";

const HEAD_CELL =
  "px-4 pb-3 pt-1 text-left text-xs font-medium tracking-wide uppercase";
const BODY_CELL = "px-4 py-4 align-middle leading-normal";

export function ProcessingPendingSessionsTable({
  rows,
}: {
  rows: ProcessingPendingSessionRow[];
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border/60 text-muted-foreground">
            <th className={HEAD_CELL}>Session</th>
            <th className={HEAD_CELL}>Batch</th>
            <th className={HEAD_CELL}>Product</th>
            <th className={HEAD_CELL}>Supplier</th>
            <th className={HEAD_CELL}>Bags</th>
            <th className={HEAD_CELL}>Input KG</th>
            <th className={HEAD_CELL}>Submitted</th>
            <th className={`${HEAD_CELL} w-24`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
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
              <td className={BODY_CELL}>{row.supplier_name}</td>
              <td className={`${BODY_CELL} tabular-nums`}>
                {row.bags_sent.toLocaleString()}
              </td>
              <td className={`${BODY_CELL} tabular-nums`}>
                {row.input_kg.toLocaleString()}
              </td>
              <td
                className={`${BODY_CELL} whitespace-nowrap text-muted-foreground`}
              >
                {new Date(row.created_at).toLocaleString()}
              </td>
              <td className={BODY_CELL}>
                <TableViewAction href={`/processing/${row.id}`} label="Review" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
