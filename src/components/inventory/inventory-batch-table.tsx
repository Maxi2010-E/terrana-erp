import { AssignWarehouseLotSelect } from "@/components/inventory/assign-warehouse-lot-select";
import { InventoryMixDetailCell } from "@/components/inventory/inventory-mix-detail-cell";
import { ProductTypeBadge } from "@/components/procurement/product-type-badge";
import { InventoryStatusBadge } from "@/components/inventory/inventory-status-badge";
import { TableViewAction } from "@/components/ui/table-view-action";
import { formatInventoryNumber } from "@/lib/inventory/inventory-number";
import type { InventoryStatus } from "@/lib/inventory/constants";
import type {
  InventoryBatchListRow,
  WarehouseLotOption,
} from "@/lib/inventory/types";

type InventoryBatchTableProps = {
  rows: InventoryBatchListRow[];
  showMixDetails?: boolean;
  warehouseLots?: WarehouseLotOption[];
};

const HEAD_CELL =
  "px-4 pb-3 pt-1 text-left text-xs font-medium tracking-wide uppercase";
const BODY_CELL = "px-4 py-4 align-middle leading-normal";

export function InventoryBatchTable({
  rows,
  showMixDetails = false,
  warehouseLots = [],
}: InventoryBatchTableProps) {
  const columnCount = showMixDetails ? 9 : 9;

  return (
    <div className="overflow-x-auto">
      <table
        className={`w-full border-collapse text-left text-sm ${
          showMixDetails ? "min-w-[1120px]" : "min-w-[1000px]"
        }`}
      >
        <thead>
          <tr className="border-b border-border/60 text-muted-foreground">
            <th className={`${HEAD_CELL} w-[7.5rem]`}>Inventory</th>
            <th className={`${HEAD_CELL} min-w-[9rem]`}>Product</th>
            {showMixDetails ? (
              <th className={`${HEAD_CELL} min-w-[11rem]`}>Mixed from</th>
            ) : null}
            <th className={`${HEAD_CELL} min-w-[4rem]`}>Bags</th>
            <th className={`${HEAD_CELL} min-w-[4.5rem]`}>KG</th>
            <th className={`${HEAD_CELL} min-w-[6.5rem]`}>Graded</th>
            <th className={`${HEAD_CELL} min-w-[7rem]`}>Status</th>
            <th className={`${HEAD_CELL} min-w-[9rem]`}>Warehouse lot</th>
            {!showMixDetails ? (
              <th className={`${HEAD_CELL} min-w-[4rem]`}>Sources</th>
            ) : null}
            <th className={`${HEAD_CELL} w-28`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columnCount}
                className="px-4 py-12 text-center text-muted-foreground"
              >
                No export inventory batches yet. Grade available pre-stock to
                create one.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border/50 last:border-0"
              >
                <td className={`${BODY_CELL} font-medium tabular-nums`}>
                  {formatInventoryNumber(row.inventory_number)}
                </td>
                <td className={BODY_CELL}>
                  <ProductTypeBadge productType={row.product_type} />
                </td>
                {showMixDetails ? (
                  <td className={BODY_CELL}>
                    <InventoryMixDetailCell
                      sources={row.mix_sources}
                      mixSummary={row.mix_summary}
                    />
                  </td>
                ) : null}
                <td className={`${BODY_CELL} tabular-nums`}>
                  {row.bags.toLocaleString()}
                </td>
                <td className={`${BODY_CELL} tabular-nums`}>
                  {row.total_kg.toLocaleString()}
                </td>
                <td
                  className={`${BODY_CELL} whitespace-nowrap tabular-nums text-muted-foreground`}
                >
                  {row.date_graded}
                </td>
                <td className={BODY_CELL}>
                  <InventoryStatusBadge
                    status={row.status as InventoryStatus}
                  />
                </td>
                <td className={BODY_CELL}>
                  {row.status === "available" && warehouseLots.length > 0 ? (
                    <AssignWarehouseLotSelect
                      batchId={row.id}
                      currentLotId={row.warehouse_lot_id}
                      lots={warehouseLots}
                    />
                  ) : (
                    <span className="text-muted-foreground">
                      {row.warehouse_lot_label ?? "—"}
                    </span>
                  )}
                </td>
                {!showMixDetails ? (
                  <td className={`${BODY_CELL} tabular-nums text-muted-foreground`}>
                    {row.source_count.toLocaleString()}
                  </td>
                ) : null}
                <td className={BODY_CELL}>
                  <TableViewAction href={`/inventory/export/${row.id}`} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
