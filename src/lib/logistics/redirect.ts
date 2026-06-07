import type { LogisticsHubTab } from "@/lib/logistics/hub";

export function buildLogisticsHubRedirect(
  tab: LogisticsHubTab,
  params: Record<string, string | undefined>,
): string {
  const search = new URLSearchParams();
  search.set("tab", tab);

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value);
    }
  }

  return `/logistics?${search.toString()}`;
}
