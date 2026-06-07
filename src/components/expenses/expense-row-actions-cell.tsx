"use client";

import { ExpenseApproveButton } from "@/components/expenses/expense-approve-button";
import { ExpensePaymentMadeButton } from "@/components/expenses/expense-payment-made-button";
import type { ExpenseRecordStatus } from "@/lib/expenses/constants";
import { expenseRowHasAction } from "@/lib/expenses/row-actions";
import type { AppRole } from "@/lib/roles";

type ExpenseRowActionsCellProps = {
  expenseId: string;
  expenseKind: "daily" | "operational";
  status: ExpenseRecordStatus;
  initiatorId: string | null;
  initiatorRole: AppRole | null;
  currentUserId: string;
  canApprove: boolean;
  canMarkPaidNow: boolean;
  approveRedirectTo: string;
  paymentRedirectTo: string;
};

export function ExpenseRowActionsCell({
  expenseId,
  expenseKind,
  status,
  initiatorId,
  initiatorRole,
  currentUserId,
  canApprove,
  canMarkPaidNow,
  approveRedirectTo,
  paymentRedirectTo,
}: ExpenseRowActionsCellProps) {
  const hasAction = expenseRowHasAction({
    status,
    initiatorId,
    initiatorRole,
    currentUserId,
    canApprove,
    canMarkPaidNow,
  });

  if (!hasAction) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  if (status === "pending_approval" && canApprove) {
    return (
      <ExpenseApproveButton
        expenseId={expenseId}
        expenseKind={expenseKind}
        redirectTo={approveRedirectTo}
      />
    );
  }

  return (
    <ExpensePaymentMadeButton
      expenseId={expenseId}
      expenseKind={expenseKind}
      redirectTo={paymentRedirectTo}
    />
  );
}
