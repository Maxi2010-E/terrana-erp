import type { LogisticsHubTab } from "@/lib/logistics/hub";

export function buildLogisticsTabQuery(
  tab: LogisticsHubTab,
  current: URLSearchParams,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of current.entries()) {
    if (key === "tab" || key === "page") {
      continue;
    }
    if (tab !== "shipments" && key === "status") {
      continue;
    }
    params.set(key, value);
  }

  params.set("tab", tab);
  return params.toString();
}

export function logisticsTabHref(
  tab: LogisticsHubTab,
  current: URLSearchParams,
): string {
  return `/logistics?${buildLogisticsTabQuery(tab, current)}`;
}
