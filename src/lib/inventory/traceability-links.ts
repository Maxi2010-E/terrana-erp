export type TraceabilityLink = {
  label: string;
  href: string;
};

export function formatTraceabilityLinksText(links: TraceabilityLink[]): string {
  if (links.length === 0) {
    return "—";
  }
  return links.map((link) => link.label).join(" · ");
}
