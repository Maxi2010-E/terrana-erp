import Link from "next/link";

import { WasteSlipPreviewDialog } from "@/components/waste/waste-slip-preview-dialog";
import { WasteTypeBadge } from "@/components/waste/waste-type-badge";
import { ProcessingStatusBadge } from "@/components/processing/processing-status-badge";
import type { ProcessingSessionStatus } from "@/lib/processing/constants";
import type { WasteListRow } from "@/lib/waste/types";

type WasteRecordsTableProps = {
  rows: WasteListRow[];
  emptyMessage?: string;
};

function formatLoad(row: WasteListRow): string {
  if (row.number_of_bags <= 0) {
    return row.extra_kg > 0 ? `${row.extra_kg.toLocaleString()} kg extra` : "—";
  }

  const parts = [`${row.number_of_bags} bag(s)`];
  if (row.kg_per_bag != null && row.kg_per_bag > 0) {
    parts.push(`${row.kg_per_bag} kg/bag`);
  }
  if (row.extra_kg > 0) {
    parts.push(`${row.extra_kg.toLocaleString()} kg extra`);
  }

  return parts.join(" · ");
}

export function WasteRecordsTable({
  rows,
  emptyMessage = "No waste records yet. Waste appears here when processing sessions record output and waste.",
}: WasteRecordsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1120px] text-left text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="pb-3 pr-4 font-medium">Date</th>
            <th className="pb-3 pr-4 font-medium">Session</th>
            <th className="pb-3 pr-4 font-medium">Batch</th>
            <th className="pb-3 pr-4 font-medium">Supplier</th>
            <th className="pb-3 pr-4 font-medium">Category</th>
            <th className="pb-3 pr-4 font-medium">Load</th>
            <th className="pb-3 pr-4 font-medium">Total kg</th>
            <th className="pb-3 pr-4 font-medium">Re-processed</th>
            <th className="pb-3 pr-4 font-medium">Available</th>
            <th className="pb-3 pr-4 font-medium">Session status</th>
            <th className="pb-3 font-medium">Slip</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={11}
                className="py-8 text-center text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="py-3 pr-4 tabular-nums">{row.date_recorded}</td>
                <td className="py-3 pr-4 font-medium">
                  <Link
                    href={`/waste/session/${row.session_id}`}
                    className="hover:text-primary hover:underline"
                  >
                    {row.session_number}
                  </Link>
                </td>
                <td className="py-3 pr-4">
                  <Link
                    href={`/procurement/${row.batch_id}`}
                    className="hover:text-primary hover:underline"
                  >
                    {row.batch_number}
                  </Link>
                </td>
                <td className="py-3 pr-4">{row.supplier_name}</td>
                <td className="py-3 pr-4">
                  <WasteTypeBadge wasteType={row.waste_type} />
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {formatLoad(row)}
                </td>
                <td className="py-3 pr-4 font-medium tabular-nums">
                  {row.weight_kg.toLocaleString()} kg
                </td>
                <td className="py-3 pr-4 tabular-nums text-muted-foreground">
                  {row.reprocessed_kg.toLocaleString()} kg
                </td>
                <td className="py-3 pr-4 font-medium tabular-nums">
                  {Math.max(
                    0,
                    row.weight_kg - row.reprocessed_kg,
                  ).toLocaleString()}{" "}
                  kg
                </td>
                <td className="py-3 pr-4">
                  <ProcessingStatusBadge
                    status={row.session_status as ProcessingSessionStatus}
                  />
                </td>
                <td className="py-3">
                  {row.session_status === "completed" ? (
                    <WasteSlipPreviewDialog sessionId={row.session_id} />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
