import type { InventoryHubTab } from "@/lib/inventory/hub";

/** Build `/inventory` query string for a tab switch (clears page; strips tab-incompatible params). */
export function buildInventoryTabQuery(
  tab: InventoryHubTab,
  current: URLSearchParams,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of current.entries()) {
    if (key === "tab" || key === "page") {
      continue;
    }
    if (tab === "pre_stock" && (key === "mix" || key === "graded_from" || key === "graded_to")) {
      continue;
    }
    if (tab === "export" && key === "status") {
      continue;
    }
    if (tab === "warehouse_lots" && (key === "status" || key === "mix" || key === "graded_from" || key === "graded_to")) {
      continue;
    }
    params.set(key, value);
  }

  params.set("tab", tab);
  return params.toString();
}

export function inventoryTabHref(
  tab: InventoryHubTab,
  current: URLSearchParams,
): string {
  const query = buildInventoryTabQuery(tab, current);
  return query ? `/inventory?${query}` : `/inventory?tab=pre_stock`;
}
