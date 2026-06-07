import { canWriteInventory } from "@/lib/permissions/matrix";
import type { AppRole } from "@/lib/roles";

export function canWriteInventoryRole(role: AppRole): boolean {
  return canWriteInventory(role);
}
