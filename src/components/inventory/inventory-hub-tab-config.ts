import { Boxes, Layers, Warehouse } from "lucide-react";

import type { HubTabConfig } from "@/components/hub/hub-tab-list";
import type { InventoryHubTab } from "@/lib/inventory/hub";

export const INVENTORY_HUB_TAB_CONFIG: HubTabConfig<InventoryHubTab>[] = [
  { id: "pre_stock", label: "Pre-stock", icon: Boxes },
  { id: "export", label: "Export inventory", icon: Warehouse },
  { id: "warehouse_lots", label: "Warehouse lots", icon: Layers },
];
