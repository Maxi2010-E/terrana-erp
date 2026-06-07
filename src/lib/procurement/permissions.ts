import {
  canViewPrices,
  canWriteProcurement,
  isAdminRole,
} from "@/lib/permissions/matrix";
import type { ProcurementStatus } from "@/lib/procurement/constants";
import type { AppRole } from "@/lib/roles";

export function canViewProcurementPricing(role: AppRole): boolean {
  return canViewPrices(role);
}

export function canEditProcurementPricing(role: AppRole): boolean {
  return isAdminRole(role);
}

export function canCreateProcurement(role: AppRole): boolean {
  return canWriteProcurement(role);
}

export function canEditPendingProcurement(
  role: AppRole,
  status: ProcurementStatus,
): boolean {
  return (
    role === "warehouse_manager" &&
    (status === "pending_approval" || status === "pending_second_approval")
  );
}

export function canSetProcurementFinalPrice(
  role: AppRole,
  status: ProcurementStatus,
): boolean {
  return isAdminRole(role) && status === "pending_admin_approval";
}

export function canConfirmProcurementReceipt(role: AppRole): boolean {
  return role === "cash_manager" || role === "logistics_manager";
}

export function canViewSupplyInvoice(role: AppRole): boolean {
  return isAdminRole(role);
}
