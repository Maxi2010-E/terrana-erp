import type { ExpenseRecordStatus } from "@/lib/expenses/constants";
import { accountsCanConfirmExpensePayment } from "@/lib/expenses/permissions";
import type { AppRole } from "@/lib/roles";

export function expenseRowHasAction({
  status,
  initiatorId,
  initiatorRole,
  currentUserId,
  canApprove,
  canMarkPaidNow,
}: {
  status: ExpenseRecordStatus;
  initiatorId: string | null;
  initiatorRole?: AppRole | null;
  currentUserId: string;
  canApprove: boolean;
  canMarkPaidNow: boolean;
}): boolean {
  if (status === "pending_approval" && canApprove) {
    return true;
  }

  return (
    status === "approved" &&
    canMarkPaidNow &&
    accountsCanConfirmExpensePayment({
      initiatorId,
      initiatorRole,
      currentUserId,
    })
  );
}

export function expenseListHasAnyAction(
  rows: Array<{
    status: ExpenseRecordStatus;
    entered_by?: string | null;
    entered_by_role?: AppRole | null;
    paid_by?: string | null;
    paid_by_role?: AppRole | null;
  }>,
  currentUserId: string,
  canApprove: boolean,
  canMarkPaidNow: boolean,
  initiatorField: "entered_by" | "paid_by",
): boolean {
  return rows.some((row) =>
    expenseRowHasAction({
      status: row.status,
      initiatorId:
        initiatorField === "entered_by"
          ? (row.entered_by ?? null)
          : (row.paid_by ?? null),
      initiatorRole:
        initiatorField === "entered_by"
          ? (row.entered_by_role ?? null)
          : (row.paid_by_role ?? null),
      currentUserId,
      canApprove,
      canMarkPaidNow,
    }),
  );
}
