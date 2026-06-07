import {
  canApproveProcessingStep,
  canParticipateInProcessingApproval,
  canRejectAtApprovalStep,
  canWriteProcessing,
  isAdminRole,
} from "@/lib/permissions/matrix";

export { canRejectAtApprovalStep };
import type { ApprovalStep } from "@/lib/permissions/matrix";
import type { AppRole } from "@/lib/roles";

export function canAccessProcessing(role: AppRole): boolean {
  return (
    isAdminRole(role) ||
    role === "warehouse_manager" ||
    role === "logistics_manager"
  );
}

export function canUnlockProcessingSession(role: AppRole): boolean {
  return role === "super_admin";
}

export function canApproveProcessingSession(
  role: AppRole,
  step: ApprovalStep = "final",
): boolean {
  return canApproveProcessingStep(role, step);
}

export function canReviewProcessingApprovals(role: AppRole): boolean {
  return canParticipateInProcessingApproval(role);
}
