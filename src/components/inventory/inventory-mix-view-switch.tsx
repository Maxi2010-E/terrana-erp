import Link from "next/link";

import { cn } from "@/lib/utils";

import { buildInventoryHubRedirect } from "@/lib/inventory/redirect";

type InventoryMixViewSwitchProps = {
  showMixDetails: boolean;
  query?: string;
  page?: number;
  gradedFrom?: string;
  gradedTo?: string;
};

function buildHref(
  showMix: boolean,
  query?: string,
  page?: number,
  gradedFrom?: string,
  gradedTo?: string,
): string {
  return buildInventoryHubRedirect("export", {
    q: query,
    page: page && page > 1 ? String(page) : undefined,
    mix: showMix ? "1" : undefined,
    graded_from: gradedFrom,
    graded_to: gradedTo,
  });
}

export function InventoryMixViewSwitch({
  showMixDetails,
  query,
  page,
  gradedFrom,
  gradedTo,
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
          href={buildHref(false, query, page, gradedFrom, gradedTo)}
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
          href={buildHref(true, query, page, gradedFrom, gradedTo)}
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
