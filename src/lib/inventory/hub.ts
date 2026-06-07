export const INVENTORY_HUB_TABS = [
  "pre_stock",
  "export",
  "warehouse_lots",
] as const;

export type InventoryHubTab = (typeof INVENTORY_HUB_TABS)[number];

export function defaultInventoryTab(): InventoryHubTab {
  return "pre_stock";
}

export function resolveInventoryTab(
  tabInput: string | undefined,
): InventoryHubTab {
  const fallback = defaultInventoryTab();
  if (!tabInput) {
    return fallback;
  }

  if (!INVENTORY_HUB_TABS.includes(tabInput as InventoryHubTab)) {
    return fallback;
  }

  return tabInput as InventoryHubTab;
}

export function inventoryTabSearchPlaceholder(tab: InventoryHubTab): string {
  switch (tab) {
    case "pre_stock":
      return "Search pre-stock number or product…";
    case "export":
      return "Search inventory number or product…";
    case "warehouse_lots":
      return "Search by label or code…";
  }
}
