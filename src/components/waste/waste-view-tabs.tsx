import Link from "next/link";

import { cn } from "@/lib/utils";

type WasteViewTabsProps = {
  view: "records" | "processing";
  pendingApprovalCount: number;
};

export function WasteViewTabs({
  view,
  pendingApprovalCount,
}: WasteViewTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/waste?view=records"
        className={cn(
          "rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
          view === "records"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        Records
      </Link>
      <Link
        href="/waste?view=processing"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
          view === "processing"
            ? "bg-primary text-primary-foreground"
            : pendingApprovalCount > 0
              ? "notification-tab-urgent"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        Re-processing
        {pendingApprovalCount > 0 ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-semibold text-white">
            {pendingApprovalCount}
          </span>
        ) : null}
      </Link>
    </div>
  );
}
