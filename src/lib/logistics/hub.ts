export const LOGISTICS_HUB_TABS = [
  "shipments",
  "customers",
  "fumigation",
  "truck-agents",
  "cost-allocation",
] as const;

export type LogisticsHubTab = (typeof LOGISTICS_HUB_TABS)[number];

export function defaultLogisticsTab(): LogisticsHubTab {
  return "shipments";
}

export function resolveLogisticsTab(
  tabInput: string | undefined,
): LogisticsHubTab {
  const fallback = defaultLogisticsTab();
  if (!tabInput) {
    return fallback;
  }

  if (!LOGISTICS_HUB_TABS.includes(tabInput as LogisticsHubTab)) {
    return fallback;
  }

  return tabInput as LogisticsHubTab;
}

export function logisticsTabSearchPlaceholder(tab: LogisticsHubTab): string {
  switch (tab) {
    case "shipments":
      return "Search shipments…";
    case "customers":
      return "Search customers…";
    case "fumigation":
      return "Search fumigation…";
    case "truck-agents":
      return "Search truck agents…";
    case "cost-allocation":
      return "Search cost allocation…";
  }
}
