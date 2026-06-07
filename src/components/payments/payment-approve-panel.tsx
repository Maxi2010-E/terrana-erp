"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { approvePaymentAction } from "@/lib/actions/payments";
import { formatBankAccountLabel, pickDefaultBankAccountId } from "@/lib/payments/bank-account";
import type { PaymentBankAccountSummary } from "@/lib/payments/types";

type PaymentApprovePanelProps = {
  paymentId: string;
  paymentMethod: "cash" | "transfer";
  supplierId: string;
  bankAccounts: PaymentBankAccountSummary[];
  initialBankAccountId: string | null;
  redirectTo: string;
};

export function PaymentApprovePanel({
  paymentId,
  paymentMethod,
  supplierId,
  bankAccounts,
  initialBankAccountId,
  redirectTo,
}: PaymentApprovePanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const defaultBankAccountId = useMemo(
    () =>
      initialBankAccountId ||
      pickDefaultBankAccountId(bankAccounts),
    [bankAccounts, initialBankAccountId],
  );
  const [bankAccountId, setBankAccountId] = useState(defaultBankAccountId);

  if (paymentMethod === "cash") {
    return (
      <div className="space-y-2">
        <Button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                await approvePaymentAction(paymentId);
                router.push(redirectTo);
                router.refresh();
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Something went wrong.",
                );
              }
            });
          }}
        >
          {pending ? "Approving…" : "Approve payment"}
        </Button>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (bankAccounts.length === 0) {
    return (
      <div className="space-y-2 text-sm">
        <p className="text-destructive">
          This transfer payment has no payout bank account. Add one on the supplier
          profile before approving.
        </p>
        <Link
          href={`/suppliers/${supplierId}`}
          className="font-medium text-primary hover:underline"
        >
          Open supplier profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
      <div className="space-y-2">
        <Label htmlFor="approve_bank_account_id">Payout bank account</Label>
        <select
          id="approve_bank_account_id"
          value={bankAccountId}
          onChange={(event) => setBankAccountId(event.target.value)}
          className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {bankAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {formatBankAccountLabel(account)}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Confirm or change the supplier account this transfer was sent to before
          approving.
        </p>
      </div>

      <Button
        type="button"
        disabled={pending || !bankAccountId}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await approvePaymentAction(paymentId, bankAccountId);
              router.push(redirectTo);
              router.refresh();
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Something went wrong.",
              );
            }
          });
        }}
      >
        {pending ? "Approving…" : "Approve payment"}
      </Button>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
