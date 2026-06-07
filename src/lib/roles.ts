export const APP_ROLES = [
  "super_admin",
  "admin",
  "warehouse_manager",
  "cash_manager",
  "logistics_manager",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

/** @deprecated Legacy DB enum values — map on read only. */
export const LEGACY_ROLE_ALIASES: Record<string, AppRole> = {
  accounts: "cash_manager",
  inventory_manager: "warehouse_manager",
};

export function normalizeAppRole(role: string | null | undefined): AppRole {
  if (!role) {
    return "cash_manager";
  }

  if ((APP_ROLES as readonly string[]).includes(role)) {
    return role as AppRole;
  }

  return LEGACY_ROLE_ALIASES[role] ?? "cash_manager";
}

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  warehouse_manager: "Warehouse Data Manager",
  cash_manager: "Cash Manager",
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
