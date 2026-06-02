import type { AppRole } from "@/lib/roles";

export function canViewProcurementPricing(role: AppRole): boolean {
  return role === "super_admin" || role === "admin";
}

export function canEditProcurementPricing(role: AppRole): boolean {
  return role === "super_admin" || role === "admin";
}
