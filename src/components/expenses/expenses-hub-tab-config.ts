import { Receipt, Wrench } from "lucide-react";

import type { HubTabConfig } from "@/components/hub/hub-tab-list";
import type { ExpenseHubTab } from "@/lib/expenses/hub";

export const EXPENSE_HUB_TAB_CONFIG: HubTabConfig<ExpenseHubTab>[] = [
  { id: "daily", label: "Daily", icon: Receipt },
  { id: "operational", label: "Operational", icon: Wrench },
];
