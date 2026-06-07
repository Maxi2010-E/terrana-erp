import {
  BadgeDollarSign,
  CalendarDays,
  Gift,
  HandCoins,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { HubTabConfig } from "@/components/hub/hub-tab-list";
import type { HrTab } from "@/lib/hr/hub";

export const HR_HUB_TAB_CONFIG: HubTabConfig<HrTab>[] = [
  { id: "employees", label: "Employees", icon: Users },
  { id: "payroll", label: "Payroll", icon: BadgeDollarSign },
  { id: "leave", label: "Leave", icon: CalendarDays },
  { id: "advances", label: "Advances", icon: HandCoins },
  { id: "bonuses", label: "Bonuses", icon: Gift },
];
