import { ProcessingStatusBadge } from "@/components/processing/processing-status-badge";
import { WasteTypeBadge } from "@/components/waste/waste-type-badge";
import { TableViewAction } from "@/components/ui/table-view-action";
import type { ProcessingSessionStatus } from "@/lib/processing/constants";
import type { WasteReprocessingSessionListRow } from "@/lib/waste/reprocessing-types";

const HEAD_CELL =
  "px-4 pb-3 pt-1 text-left text-xs font-medium tracking-wide uppercase";
const BODY_CELL = "px-4 py-4 align-middle leading-normal";

export function WasteReprocessingSessionsTable({
  rows,
}: {
  rows: WasteReprocessingSessionListRow[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border/60 text-muted-foreground">
            <th className={HEAD_CELL}>Session</th>
            <th className={HEAD_CELL}>Waste type</th>
            <th className={HEAD_CELL}>Origin session</th>
            <th className={HEAD_CELL}>Kg sent</th>
            <th className={HEAD_CELL}>Output kg</th>
            <th className={HEAD_CELL}>Local product</th>
            <th className={HEAD_CELL}>Status</th>
            <th className={HEAD_CELL}>Date</th>
            <th className={`${HEAD_CELL} w-24`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={9}
                className="px-4 py-10 text-center text-muted-foreground"
              >
                No re-processing sessions yet.
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
                <td className={BODY_CELL}>
                  <WasteTypeBadge wasteType={row.waste_type} />
                </td>
                <td className={BODY_CELL}>{row.origin_session_number}</td>
                <td className={`${BODY_CELL} tabular-nums`}>
                  {row.kg_sent.toLocaleString()}
                </td>
                <td className={`${BODY_CELL} tabular-nums`}>
                  {row.output_kg != null
                    ? row.output_kg.toLocaleString()
                    : "—"}
                </td>
                <td className={BODY_CELL}>
                  {row.product_label ?? "—"}
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
                  <TableViewAction href={`/waste/reprocessing/${row.id}`} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
