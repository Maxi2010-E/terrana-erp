import Link from "next/link";

import { TableViewAction } from "@/components/ui/table-view-action";
import type { WarehouseLotListRow } from "@/lib/inventory/types";

const HEAD_CELL =
  "px-4 pb-3 pt-1 text-left text-xs font-medium tracking-wide uppercase";
const BODY_CELL = "px-4 py-4 align-middle leading-normal";

type WarehouseLotTableProps = {
  rows: WarehouseLotListRow[];
};

export function WarehouseLotTable({ rows }: WarehouseLotTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border/60 text-muted-foreground">
            <th className={HEAD_CELL}>Code</th>
            <th className={HEAD_CELL}>Label</th>
            <th className={HEAD_CELL}>Stacked</th>
            <th className={HEAD_CELL}>Batches</th>
            <th className={HEAD_CELL}>Bags on hand</th>
            <th className={`${HEAD_CELL} w-28`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                No warehouse lots yet. Create a lot, then assign export inventory to it.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border/50 last:border-0"
              >
                <td className={`${BODY_CELL} font-medium tabular-nums`}>
                  {row.lot_code}
                </td>
                <td className={BODY_CELL}>
                  <Link
                    href={`/inventory/warehouse-lots/${row.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {row.label}
                  </Link>
                </td>
                <td className={`${BODY_CELL} tabular-nums text-muted-foreground`}>
                  {row.stacked_date ?? "—"}
                </td>
                <td className={`${BODY_CELL} tabular-nums`}>
                  {row.batch_count.toLocaleString()}
                </td>
                <td className={`${BODY_CELL} tabular-nums`}>
                  {row.bags_on_hand.toLocaleString()}
                </td>
                <td className={BODY_CELL}>
                  <TableViewAction href={`/inventory/warehouse-lots/${row.id}`} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
