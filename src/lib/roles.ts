export const APP_ROLES = [
  "super_admin",
  "admin",
  "accounts",
  "inventory_manager",
  "logistics_manager",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  accounts: "Accounts",
  inventory_manager: "Inventory Manager",
  logistics_manager: "Logistics Manager",
};

export function hasRole(userRole: AppRole, allowed?: AppRole[]): boolean {
  if (!allowed || allowed.length === 0) {
    return true;
  }

  if (userRole === "super_admin") {
    return true;
  }

  return allowed.includes(userRole);
}
