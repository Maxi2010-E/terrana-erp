import Link from "next/link";

import { cn } from "@/lib/utils";

type InventoryMixViewSwitchProps = {
  showMixDetails: boolean;
  query?: string;
  page?: number;
};

function buildHref(showMix: boolean, query?: string, page?: number): string {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (page && page > 1) {
    params.set("page", String(page));
  }

  if (showMix) {
    params.set("mix", "1");
  }

  const qs = params.toString();
  return qs ? `/inventory/export?${qs}` : "/inventory/export";
}

export function InventoryMixViewSwitch({
  showMixDetails,
  query,
  page,
}: InventoryMixViewSwitchProps) {
  return (
    <div className="flex shrink-0 flex-col gap-1.5 sm:items-end">
      <span className="text-xs font-medium text-muted-foreground">Table view</span>
      <div
        className="inline-flex rounded-xl border border-border/60 bg-muted/20 p-1"
        role="group"
        aria-label="Export inventory table view"
      >
        <Link
          href={buildHref(false, query, page)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            !showMixDetails
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-current={!showMixDetails ? "page" : undefined}
        >
          Summary
        </Link>
        <Link
          href={buildHref(true, query, page)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            showMixDetails
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-current={showMixDetails ? "page" : undefined}
        >
          Mix sources
        </Link>
      </div>
    </div>
  );
}
