import type { AppRole } from "@/lib/roles";

export function canReadLogistics(role: AppRole): boolean {
  return (
    role === "super_admin" || role === "admin" || role === "logistics_manager"
  );
}

export function canWriteLogistics(role: AppRole): boolean {
  return (
    role === "super_admin" || role === "admin" || role === "logistics_manager"
  );
}
