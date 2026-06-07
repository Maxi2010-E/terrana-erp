import {
  canApprovePayment as matrixCanApprovePayment,
  canRecordPayment as matrixCanRecordPayment,
  canViewPrices,
} from "@/lib/permissions/matrix";
import type { AppRole } from "@/lib/roles";

export function canViewPaymentAmounts(role: AppRole): boolean {
  return canViewPrices(role);
}

export function canRecordPayment(role: AppRole): boolean {
  return matrixCanRecordPayment(role);
}

export function canApprovePayment(role: AppRole): boolean {
  return matrixCanApprovePayment(role);
}

export function canUnlockPayment(role: AppRole): boolean {
  return role === "super_admin";
}
