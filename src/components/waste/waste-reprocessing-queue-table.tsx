import Link from "next/link";

import { WasteTypeBadge } from "@/components/waste/waste-type-badge";
import { buttonVariants } from "@/components/ui/button";
import type { WasteReprocessingQueueRow } from "@/lib/waste/reprocessing-types";
import { cn } from "@/lib/utils";

const HEAD_CELL =
  "px-4 pb-3 pt-1 text-left text-xs font-medium tracking-wide uppercase";
const BODY_CELL = "px-4 py-4 align-middle leading-normal";

export function WasteReprocessingQueueTable({
  rows,
}: {
  rows: WasteReprocessingQueueRow[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border/60 text-muted-foreground">
            <th className={HEAD_CELL}>Source</th>
            <th className={HEAD_CELL}>Category</th>
            <th className={HEAD_CELL}>Origin</th>
            <th className={HEAD_CELL}>Batch</th>
            <th className={HEAD_CELL}>Total kg</th>
            <th className={HEAD_CELL}>Re-processed</th>
            <th className={HEAD_CELL}>Available</th>
            <th className={`${HEAD_CELL} w-32`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="px-4 py-10 text-center text-muted-foreground"
              >
                No waste available for re-processing. Complete processing sessions
                first, or finish re-processing sessions to release secondary waste.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={`${row.source_kind}-${row.source_id}`}
                className="border-b border-border/50 last:border-0"
              >
                <td className={BODY_CELL}>
                  <span className="text-xs text-muted-foreground">
                    {row.source_kind === "collection"
                      ? "Collection"
                      : "Secondary waste"}
                  </span>
                </td>
                <td className={BODY_CELL}>
                  <WasteTypeBadge wasteType={row.waste_type} />
                </td>
                <td className={`${BODY_CELL} whitespace-nowrap font-medium`}>
                  {row.origin_session_number}
                </td>
                <td className={BODY_CELL}>{row.origin_batch_number}</td>
                <td className={`${BODY_CELL} tabular-nums`}>
                  {row.total_kg.toLocaleString()} kg
                </td>
                <td className={`${BODY_CELL} tabular-nums text-muted-foreground`}>
                  {row.reprocessed_kg.toLocaleString()} kg
                </td>
                <td className={`${BODY_CELL} font-medium tabular-nums`}>
                  {row.available_kg.toLocaleString()} kg
                </td>
                <td className={BODY_CELL}>
                  <Link
                    href={`/waste/reprocessing/new?source=${row.source_id}&kind=${row.source_kind}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                    )}
                  >
                    Start
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
