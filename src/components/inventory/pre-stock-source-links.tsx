import Link from "next/link";

import type { TraceabilityLink } from "@/lib/inventory/traceability-links";
import { formatTraceabilityLinksText } from "@/lib/inventory/traceability-links";

type PreStockSourceLinksProps = {
  links: TraceabilityLink[];
  className?: string;
};

export function PreStockSourceLinks({
  links,
  className,
}: PreStockSourceLinksProps) {
  if (links.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (links.length === 1) {
    return (
      <Link
        href={links[0]!.href}
        className={`text-primary hover:underline ${className ?? ""}`}
      >
        {links[0]!.label}
      </Link>
    );
  }

  return (
    <span className={`inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 ${className ?? ""}`}>
      {links.map((link, index) => (
        <span key={`${link.href}-${index}`} className="inline-flex items-center gap-1.5">
          {index > 0 ? (
            <span aria-hidden className="text-muted-foreground">
              ·
            </span>
          ) : null}
          <Link href={link.href} className="text-primary hover:underline">
            {link.label}
          </Link>
        </span>
      ))}
    </span>
  );
}

export function PreStockSourceLinksText({ links }: { links: TraceabilityLink[] }) {
  return formatTraceabilityLinksText(links);
}
