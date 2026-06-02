import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProcurementLoadToggleProps = {
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
    params.set("load", "1");
  }

  const qs = params.toString();
  return qs ? `/procurement?${qs}` : "/procurement";
}

export function ProcurementLoadToggle({
  enabled,
  query,
  page,
}: ProcurementLoadToggleProps) {
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
      {enabled ? "Hide load details" : "Show load details"}
    </Link>
  );
}
