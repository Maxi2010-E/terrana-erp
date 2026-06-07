import Link from "next/link";

import { ProductTypeBadge } from "@/components/procurement/product-type-badge";
import { InventoryStatusBadge } from "@/components/inventory/inventory-status-badge";
import { formatInventoryNumber } from "@/lib/inventory/inventory-number";
import type { InventoryStatus } from "@/lib/inventory/constants";
import type { WarehouseLotBatchRow } from "@/lib/inventory/types";

const HEAD_CELL =
  "px-4 pb-3 pt-1 text-left text-xs font-medium tracking-wide uppercase";
const BODY_CELL = "px-4 py-4 align-middle leading-normal";

type WarehouseLotBatchTableProps = {
  rows: WarehouseLotBatchRow[];
};

export function WarehouseLotBatchTable({ rows }: WarehouseLotBatchTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border/60 text-muted-foreground">
            <th className={HEAD_CELL}>Inventory</th>
            <th className={HEAD_CELL}>Product</th>
            <th className={HEAD_CELL}>Bags remaining</th>
            <th className={HEAD_CELL}>KG</th>
            <th className={HEAD_CELL}>Graded</th>
            <th className={HEAD_CELL}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                No inventory assigned to this lot yet. Assign batches from{" "}
                <Link href="/inventory?tab=export" className="text-primary hover:underline">
                  export inventory
                </Link>
                .
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border/50 last:border-0"
              >
                <td className={BODY_CELL}>
                  <Link
                    href={`/inventory/export/${row.id}`}
                    className="font-medium tabular-nums text-primary hover:underline"
                  >
                    {formatInventoryNumber(row.inventory_number)}
                  </Link>
                </td>
                <td className={BODY_CELL}>
                  <ProductTypeBadge productType={row.product_type} />
                </td>
                <td className={`${BODY_CELL} tabular-nums`}>
                  {row.bags.toLocaleString()}
                </td>
                <td className={`${BODY_CELL} tabular-nums`}>
                  {row.total_kg.toLocaleString()}
                </td>
                <td className={`${BODY_CELL} tabular-nums text-muted-foreground`}>
                  {row.date_graded}
                </td>
                <td className={BODY_CELL}>
                  <InventoryStatusBadge status={row.status as InventoryStatus} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
