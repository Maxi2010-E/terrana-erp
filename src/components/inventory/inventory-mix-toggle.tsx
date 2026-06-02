import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InventoryMixToggleProps = {
  enabled: boolean;
  query?: string;
  page?: number;
};

function buildToggleHref(
  enabled: boolean,
  query?: string,
  page?: number,
): string {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (page && page > 1) {
    params.set("page", String(page));
  }

  if (!enabled) {
    params.set("mix", "1");
  }

  const qs = params.toString();
  return qs ? `/inventory/export?${qs}` : "/inventory/export";
}

export function InventoryMixToggle({
  enabled,
  query,
  page,
}: InventoryMixToggleProps) {
  return (
    <Link
      href={buildToggleHref(enabled, query, page)}
      className={cn(
        buttonVariants({
          variant: enabled ? "secondary" : "outline",
          size: "sm",
        }),
      )}
      aria-pressed={enabled}
    >
      {enabled ? "Hide mix details" : "Show mix details"}
    </Link>
  );
}
