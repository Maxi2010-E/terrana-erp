import { WasteTypeBadge } from "@/components/waste/waste-type-badge";
import type { WasteLocalStockRow } from "@/lib/waste/reprocessing-types";

const HEAD_CELL =
  "px-4 pb-3 pt-1 text-left text-xs font-medium tracking-wide uppercase";
const BODY_CELL = "px-4 py-4 align-middle leading-normal";

function statusLabel(status: WasteLocalStockRow["status"]): string {
  return status === "available" ? "Available" : "Depleted";
}

export function WasteLocalStockTable({
  rows,
}: {
  rows: WasteLocalStockRow[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border/60 text-muted-foreground">
            <th className={HEAD_CELL}>Stock #</th>
            <th className={HEAD_CELL}>Product</th>
            <th className={HEAD_CELL}>Source waste</th>
            <th className={HEAD_CELL}>Bags</th>
            <th className={HEAD_CELL}>Total kg</th>
            <th className={HEAD_CELL}>Session</th>
            <th className={HEAD_CELL}>Received</th>
            <th className={HEAD_CELL}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="px-4 py-10 text-center text-muted-foreground"
              >
                No local stock yet. Complete a re-processing session to add
                sellable product.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border/50 last:border-0"
              >
                <td className={`${BODY_CELL} whitespace-nowrap font-medium tabular-nums`}>
                  {row.stock_number}
                </td>
                <td className={BODY_CELL}>{row.product_label}</td>
                <td className={BODY_CELL}>
                  <WasteTypeBadge wasteType={row.source_waste_type} />
                </td>
                <td className={`${BODY_CELL} tabular-nums`}>
                  {row.bags.toLocaleString()}
                </td>
                <td className={`${BODY_CELL} tabular-nums`}>
                  {row.total_kg.toLocaleString()}
                </td>
                <td className={BODY_CELL}>{row.reprocessing_session_number}</td>
                <td
                  className={`${BODY_CELL} whitespace-nowrap tabular-nums text-muted-foreground`}
                >
                  {row.date_received}
                </td>
                <td className={BODY_CELL}>
                  <span
                    className={
                      row.status === "available"
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-muted-foreground"
                    }
                  >
                    {statusLabel(row.status)}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
