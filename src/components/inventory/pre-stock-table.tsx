import { PreStockSourceLinks } from "@/components/inventory/pre-stock-source-links";
import { ProductTypeBadge } from "@/components/procurement/product-type-badge";
import { InventoryStatusBadge } from "@/components/inventory/inventory-status-badge";
import { TableViewAction } from "@/components/ui/table-view-action";
import {
  formatPreStockNumber,
} from "@/lib/inventory/inventory-number";
import type { InventoryStatus } from "@/lib/inventory/constants";
import type { PreStockListRow } from "@/lib/inventory/types";

type PreStockTableProps = {
  rows: PreStockListRow[];
};

const HEAD_CELL =
  "px-4 pb-3 pt-1 text-left text-xs font-medium tracking-wide uppercase";
const BODY_CELL = "px-4 py-4 align-middle leading-normal";

export function PreStockTable({ rows }: PreStockTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border/60 text-muted-foreground">
            <th className={`${HEAD_CELL} w-[7.5rem]`}>Pre-stock</th>
            <th className={`${HEAD_CELL} min-w-[10rem]`}>Source</th>
            <th className={`${HEAD_CELL} min-w-[9rem]`}>Product</th>
            <th className={`${HEAD_CELL} min-w-[5rem]`}>Bags avail.</th>
            <th className={`${HEAD_CELL} min-w-[4.5rem]`}>KG</th>
            <th className={`${HEAD_CELL} min-w-[6.5rem]`}>Received</th>
            <th className={`${HEAD_CELL} min-w-[7rem]`}>Status</th>
            <th className={`${HEAD_CELL} min-w-[5rem]`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="px-4 py-12 text-center text-muted-foreground"
              >
                No pre-stock records yet. Complete processing or approve clean
                on-site procurement with pre-stock to create one.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border/50 last:border-0"
              >
                <td className={`${BODY_CELL} font-medium tabular-nums`}>
                  {formatPreStockNumber(row.pre_stock_number)}
                </td>
                <td className={BODY_CELL}>
                  <PreStockSourceLinks links={row.source_links} />
                </td>
                <td className={BODY_CELL}>
                  <ProductTypeBadge productType={row.product_type} />
                </td>
                <td className={`${BODY_CELL} tabular-nums`}>
                  {row.bags.toLocaleString()} /{" "}
                  {row.bags_received.toLocaleString()}
                </td>
                <td className={`${BODY_CELL} tabular-nums`}>
                  {row.total_kg.toLocaleString()}
                </td>
                <td
                  className={`${BODY_CELL} whitespace-nowrap tabular-nums text-muted-foreground`}
                >
                  {row.date_received}
                </td>
                <td className={BODY_CELL}>
                  <InventoryStatusBadge
                    status={row.status as InventoryStatus}
                  />
                </td>
                <td className={BODY_CELL}>
                  <TableViewAction href={`/inventory/pre-stock/${row.id}`} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
