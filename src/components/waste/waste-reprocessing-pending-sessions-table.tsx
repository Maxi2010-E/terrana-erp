import { WasteTypeBadge } from "@/components/waste/waste-type-badge";
import { TableViewAction } from "@/components/ui/table-view-action";
import type { WasteReprocessingPendingSessionRow } from "@/lib/waste/reprocessing-types";

const HEAD_CELL =
  "px-4 pb-3 pt-1 text-left text-xs font-medium tracking-wide uppercase";
const BODY_CELL = "px-4 py-4 align-middle leading-normal";

export function WasteReprocessingPendingSessionsTable({
  rows,
}: {
  rows: WasteReprocessingPendingSessionRow[];
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
            <th className={HEAD_CELL}>Waste type</th>
            <th className={HEAD_CELL}>Local product</th>
            <th className={HEAD_CELL}>Origin</th>
            <th className={HEAD_CELL}>Kg sent</th>
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
              <td className={BODY_CELL}>
                <WasteTypeBadge wasteType={row.waste_type} />
              </td>
              <td className={BODY_CELL}>{row.local_product_label}</td>
              <td className={BODY_CELL}>{row.origin_session_number}</td>
              <td className={`${BODY_CELL} tabular-nums`}>
                {row.kg_sent.toLocaleString()}
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
                <TableViewAction
                  href={`/waste/reprocessing/${row.id}`}
                  label="Review"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
