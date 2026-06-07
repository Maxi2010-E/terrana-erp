"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  markDailyExpensePaymentMadeAction,
  markOperationalExpensePaymentMadeAction,
} from "@/lib/actions/expenses";

type ExpensePaymentMadeButtonProps = {
  expenseId: string;
  expenseKind: "daily" | "operational";
  redirectTo: string;
  size?: "default" | "sm";
};

export function ExpensePaymentMadeButton({
  expenseId,
  expenseKind,
  redirectTo,
  size = "sm",
}: ExpensePaymentMadeButtonProps) {
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
                await markDailyExpensePaymentMadeAction(expenseId);
              } else {
                await markOperationalExpensePaymentMadeAction(expenseId);
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
        {pending ? "Saving…" : "Paid now"}
      </Button>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
