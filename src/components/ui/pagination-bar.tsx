import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaginationBarProps = {
  page: number;
  pageSize?: number;
  total: number;
  pathname: string;
  query?: Record<string, string | undefined>;
};

function buildHref(
  pathname: string,
  page: number,
  query: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value) {
      params.set(key, value);
    }
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function PaginationBar({
  page,
  pageSize = 25,
  total,
  pathname,
  query = {},
}: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const prevHref = buildHref(pathname, page - 1, query);
  const nextHref = buildHref(pathname, page + 1, query);

  return (
    <div className="flex items-center justify-between gap-4 border-t pt-4 text-sm">
      <p className="text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        {page <= 1 ? (
          <span
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "pointer-events-none opacity-50",
            )}
          >
            <ChevronLeft className="size-4" />
            Previous
          </span>
        ) : (
          <Link
            href={prevHref}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Link>
        )}
        <span>
          Page {page} of {totalPages}
        </span>
        {page >= totalPages ? (
          <span
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "pointer-events-none opacity-50",
            )}
          >
            Next
            <ChevronRight className="size-4" />
          </span>
        ) : (
          <Link
            href={nextHref}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Next
            <ChevronRight className="size-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
