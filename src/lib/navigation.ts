import type { LucideIcon } from "lucide-react";
import {
  BadgeDollarSign,
  Boxes,
  Factory,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  UserCog,
  Warehouse,
} from "lucide-react";

import type { AppRole } from "@/lib/roles";

export type NavItem = {
  title: string;
  href?: string;
  icon: LucideIcon;
  roles?: AppRole[];
  children?: NavItem[];
  phase?: number;
};

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "HR",
    icon: Users,
    roles: ["super_admin", "admin", "accounts"],
    children: [
      {
        title: "Employees",
        href: "/hr/employees",
        icon: Users,
        roles: ["super_admin", "admin"],
        phase: 1,
      },
      {
        title: "Payroll",
        href: "/hr/payroll",
        icon: BadgeDollarSign,
        roles: ["super_admin", "admin", "accounts"],
        phase: 1,
      },
      {
        title: "Leave",
        href: "/hr/leave",
        icon: FileText,
        roles: ["super_admin", "admin"],
        phase: 1,
      },
      {
        title: "Advances",
        href: "/hr/advances",
        icon: FileText,
        roles: ["super_admin", "admin", "accounts"],
        phase: 1,
      },
      {
        title: "Bonuses",
        href: "/hr/bonuses",
        icon: FileText,
        roles: ["super_admin", "admin", "accounts"],
        phase: 1,
      },
    ],
  },
  {
    title: "Users",
    href: "/users",
    icon: UserCog,
    roles: ["super_admin", "admin"],
    phase: 1,
  },
  {
    title: "Suppliers",
    href: "/suppliers",
    icon: ShoppingCart,
    roles: ["super_admin", "admin", "accounts"],
    phase: 2,
  },
  {
    title: "Procurement",
    href: "/procurement",
    icon: Package,
    roles: ["super_admin", "admin", "accounts"],
    phase: 3,
  },
  {
    title: "Processing",
    href: "/processing",
    icon: Factory,
    roles: ["super_admin", "admin", "accounts", "inventory_manager"],
    phase: 4,
  },
  {
    title: "Inventory",
    icon: Warehouse,
    roles: ["super_admin", "admin", "inventory_manager"],
    children: [
      {
        title: "Pre-Stock",
        href: "/inventory/pre-stock",
        icon: Boxes,
        roles: ["super_admin", "admin", "inventory_manager"],
        phase: 5,
      },
      {
        title: "Export Inventory",
        href: "/inventory/export",
        icon: Warehouse,
        roles: ["super_admin", "admin", "inventory_manager"],
        phase: 5,
      },
    ],
  },
  {
    title: "Payments",
    href: "/payments",
    icon: BadgeDollarSign,
    roles: ["super_admin", "admin", "accounts"],
    phase: 6,
  },
  {
    title: "Expenses",
    icon: FileText,
    roles: ["super_admin", "admin", "accounts"],
    children: [
      {
        title: "Daily Expenses",
        href: "/expenses/daily",
        icon: FileText,
        roles: ["super_admin", "admin", "accounts"],
        phase: 7,
      },
      {
        title: "Operational Expenses",
        href: "/expenses/operational",
        icon: FileText,
        roles: ["super_admin", "admin", "accounts"],
        phase: 7,
      },
    ],
  },
  {
    title: "Logistics",
    icon: Truck,
    roles: ["super_admin", "admin", "logistics_manager"],
    children: [
      {
        title: "Customers",
        href: "/logistics/customers",
        icon: Users,
        roles: ["super_admin", "admin", "logistics_manager"],
        phase: 8,
      },
      {
        title: "Fumigation Chambers",
        href: "/logistics/fumigation",
        icon: Factory,
        roles: ["super_admin", "admin", "logistics_manager"],
        phase: 8,
      },
      {
        title: "Truck Agents",
        href: "/logistics/truck-agents",
        icon: Truck,
        roles: ["super_admin", "admin", "logistics_manager"],
        phase: 8,
      },
      {
        title: "Shipments",
        href: "/logistics/shipments",
        icon: Truck,
        roles: ["super_admin", "admin", "logistics_manager"],
        phase: 8,
      },
    ],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileText,
    roles: ["super_admin", "admin"],
    phase: 9,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["super_admin", "admin"],
  },
];

export function filterNavByRole(items: NavItem[], role: AppRole): NavItem[] {
  return items
    .filter(
      (item) =>
        !item.roles || item.roles.includes(role) || role === "super_admin",
    )
    .map((item) => ({
      ...item,
      children: item.children ? filterNavByRole(item.children, role) : undefined,
    }))
    .filter((item) => item.href || (item.children && item.children.length > 0));
}
