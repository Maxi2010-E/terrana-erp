import type { InventoryHubTab } from "@/lib/inventory/hub";

export function buildInventoryHubRedirect(
  tab: InventoryHubTab,
  params: Record<string, string | undefined>,
): string {
  const search = new URLSearchParams();
  search.set("tab", tab);

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value);
    }
  }

  return `/inventory?${search.toString()}`;
}
