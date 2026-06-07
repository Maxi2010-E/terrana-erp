"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  approveDailyExpenseAction,
  approveOperationalExpenseAction,
} from "@/lib/actions/expenses";

type ExpenseApproveButtonProps = {
  expenseId: string;
  expenseKind: "daily" | "operational";
  redirectTo: string;
  size?: "default" | "sm";
};

export function ExpenseApproveButton({
  expenseId,
  expenseKind,
  redirectTo,
  size = "sm",
}: ExpenseApproveButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <Button
        type="button"
        size={size}
        variant="outline"
        disabled={pending}
        className="shrink-0 border-border bg-background font-medium text-foreground shadow-sm hover:bg-muted"
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              if (expenseKind === "daily") {
                await approveDailyExpenseAction(expenseId);
              } else {
                await approveOperationalExpenseAction(expenseId);
              }
              window.location.assign(redirectTo);
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Something went wrong.",
              );
            }
          });
        }}
      >
        {pending ? "Approving…" : "Approve"}
      </Button>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
