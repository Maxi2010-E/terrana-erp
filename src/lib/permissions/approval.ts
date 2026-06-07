import type { ApprovalStep } from "@/lib/permissions/matrix";
import type { ProcurementStatus } from "@/lib/procurement/constants";
import type { ProcessingSessionStatus } from "@/lib/processing/constants";

export const PENDING_PROCUREMENT_STATUSES = [
  "pending_approval",
  "pending_second_approval",
  "pending_admin_approval",
] as const;

export const PENDING_PROCESSING_STATUSES = [
  "pending_approval",
  "pending_second_approval",
  "pending_admin_approval",
] as const;

export function procurementStepFromStatus(
  status: ProcurementStatus,
): ApprovalStep | null {
  if (status === "pending_approval") {
    return "first";
  }
  if (status === "pending_second_approval") {
    return "second";
  }
  if (status === "pending_admin_approval") {
    return "final";
  }
  return null;
}

export function processingStepFromStatus(
  status: ProcessingSessionStatus,
): ApprovalStep | null {
  if (status === "pending_approval") {
    return "first";
  }
  if (status === "pending_second_approval") {
    return "second";
  }
  if (status === "pending_admin_approval") {
    return "final";
  }
  return null;
}

export function nextProcurementStatus(
  current: ProcurementStatus,
): ProcurementStatus | null {
  if (current === "pending_approval") {
    return "pending_admin_approval";
  }
  if (current === "pending_second_approval") {
    return "pending_admin_approval";
  }
  if (current === "pending_admin_approval") {
    return "approved";
  }
  return null;
}

export function nextProcessingStatusAfterApproval(
  current: ProcessingSessionStatus,
): ProcessingSessionStatus | null {
  if (current === "pending_approval") {
    return "pending_second_approval";
  }
  if (current === "pending_second_approval") {
    return "pending_admin_approval";
  }
  if (current === "pending_admin_approval") {
    return "in_progress";
  }
  return null;
}
