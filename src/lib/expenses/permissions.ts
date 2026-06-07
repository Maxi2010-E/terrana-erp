import {
  canApproveExpenses,
  canMarkExpensePaid,
  canTopUpPettyCash,
  canWriteExpenses,
  isAdminRole,
} from "@/lib/permissions/matrix";
import { normalizeAppRole, type AppRole } from "@/lib/roles";

export function canRecordExpense(role: AppRole | string): boolean {
  return canWriteExpenses(normalizeAppRole(role));
}

export function canApproveExpense(role: AppRole): boolean {
  return canApproveExpenses(role);
}

export { canTopUpPettyCash };

/** Cash manager confirms cash/transfer from petty cash after approval. */
export function canMarkExpensePaidNow(role: AppRole): boolean {
  return canMarkExpensePaid(role);
}

export function accountsCanConfirmExpensePayment({
  initiatorId,
  initiatorRole,
  currentUserId,
}: {
  initiatorId: string | null;
  initiatorRole: AppRole | null | undefined;
  currentUserId: string;
}): boolean {
  if (!initiatorId) {
    return false;
  }

  if (initiatorId === currentUserId) {
    return true;
  }

  return initiatorRole === "admin" || initiatorRole === "super_admin";
}
