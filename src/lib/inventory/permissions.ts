import type { AppRole } from "@/lib/roles";

export function canAccessInventory(role: AppRole): boolean {
  return (
    role === "super_admin" || role === "admin" || role === "inventory_manager"
  );
}

export function canCreateInventoryBatch(role: AppRole): boolean {
  return canAccessInventory(role);
}
