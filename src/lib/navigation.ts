import type { LucideIcon } from "lucide-react";
import {
  BadgeDollarSign,
  Boxes,
  Factory,
  FileText,
  Recycle,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  UserCog,
  Warehouse,
} from "lucide-react";

import { canAccessModule } from "@/lib/permissions/matrix";
import type { AppModule } from "@/lib/permissions/matrix";
import type { AppRole } from "@/lib/roles";

export type NavItem = {
  title: string;
  href?: string;
  icon: LucideIcon;
  module?: AppModule;
  roles?: AppRole[];
  children?: NavItem[];
  phase?: number;
};

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    module: "dashboard",
  },
  {
    title: "Office",
    href: "/office",
    icon: MessageSquare,
    module: "office",
  },
  {
    title: "HR",
    href: "/hr",
    icon: Users,
    module: "hr",
    phase: 1,
  },
  {
    title: "Users",
    href: "/users",
    icon: UserCog,
    module: "users",
    phase: 1,
  },
  {
    title: "Suppliers",
    href: "/suppliers",
    icon: ShoppingCart,
    module: "suppliers",
    phase: 2,
  },
  {
    title: "Procurement",
    href: "/procurement",
    icon: Package,
    module: "procurement",
    phase: 3,
  },
  {
    title: "Processing",
    href: "/processing",
    icon: Factory,
    module: "processing",
    phase: 4,
  },
  {
    title: "Waste",
    href: "/waste",
    icon: Recycle,
    module: "waste",
    phase: 4,
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Warehouse,
    module: "inventory",
    phase: 5,
  },
  {
    title: "Payments",
    href: "/payments",
    icon: BadgeDollarSign,
    module: "payments",
    phase: 6,
  },
  {
    title: "Expenses",
    href: "/expenses",
    icon: FileText,
    module: "expenses",
    phase: 7,
  },
  {
    title: "Logistics",
    href: "/logistics",
    icon: Truck,
    module: "logistics",
    phase: 8,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileText,
    module: "reports",
    phase: 9,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    module: "settings",
  },
];

export function filterNavByRole(items: NavItem[], role: AppRole): NavItem[] {
  return items
    .filter((item) => {
      if (role === "super_admin") {
        return true;
      }
      if (item.module) {
        return canAccessModule(role, item.module);
      }
      return !item.roles || item.roles.includes(role);
    })
    .map((item) => ({
      ...item,
      children: item.children ? filterNavByRole(item.children, role) : undefined,
    }))
    .filter((item) => item.href || (item.children && item.children.length > 0));
}
