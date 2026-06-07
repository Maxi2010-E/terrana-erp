import { Factory, Layers, Package, Truck, Users } from "lucide-react";

import type { HubTabConfig } from "@/components/hub/hub-tab-list";
import type { LogisticsHubTab } from "@/lib/logistics/hub";

export const LOGISTICS_HUB_TAB_CONFIG: HubTabConfig<LogisticsHubTab>[] = [
  { id: "shipments", label: "Shipments", icon: Package },
  { id: "customers", label: "Customers", icon: Users },
  { id: "fumigation", label: "Fumigation", icon: Factory },
  { id: "truck-agents", label: "Truck agents", icon: Truck },
  { id: "cost-allocation", label: "Cost allocation", icon: Layers },
];
