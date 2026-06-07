"use client";

import { HubSearchInput } from "@/components/hub/hub-search-input";
import type { InventoryHubTab } from "@/lib/inventory/hub";

type InventoryHubSearchProps = {
  tab: InventoryHubTab;
  placeholder: string;
  defaultValue?: string;
  preserveParams?: Record<string, string | undefined>;
};

export function InventoryHubSearch(props: InventoryHubSearchProps) {
  return <HubSearchInput basePath="/inventory" {...props} />;
}
