import Link from "next/link";

import {
  WASTE_TYPES,
  WASTE_TYPE_LABELS,
  type WasteType,
} from "@/lib/processing/constants";
import type { WasteDashboardSummary } from "@/lib/waste/types";
import { cn } from "@/lib/utils";

type WasteDashboardCardsProps = {
  summary: WasteDashboardSummary;
  activeType?: WasteType;
};

export function WasteDashboardCards({
  summary,
  activeType,
}: WasteDashboardCardsProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card px-4 py-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total waste recorded
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums">
            {summary.total_kg.toLocaleString()} kg
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {summary.record_count.toLocaleString()} line(s) across{" "}
            {summary.session_count.toLocaleString()} session(s)
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card px-4 py-4 shadow-sm sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            By category
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {WASTE_TYPES.map((type) => (
              <Link
                key={type}
                href={
                  activeType === type ? "/waste" : `/waste?type=${type}`
                }
                className={cn(
                  "rounded-xl border px-3 py-2.5 transition-colors hover:bg-muted/40",
                  activeType === type
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/60",
                )}
              >
                <p className="text-xs text-muted-foreground">
                  {WASTE_TYPE_LABELS[type]}
                </p>
                <p className="mt-1 text-sm font-semibold tabular-nums">
                  {summary.by_type[type].toLocaleString()} kg
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
