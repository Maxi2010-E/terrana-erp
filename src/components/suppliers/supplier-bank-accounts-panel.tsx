"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BankAccountFormState } from "@/lib/actions/suppliers";
import { formatBankAccountLabel, pickDefaultBankAccountId } from "@/lib/payments/bank-account";
import type { SupplierBankAccount } from "@/lib/suppliers/types";

const selectClassName =
  "flex h-10 w-full max-w-md rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type SupplierBankAccountsPanelProps = {
  supplierId: string;
  bankAccounts: SupplierBankAccount[];
  canEdit: boolean;
  adding: boolean;
  onAddingChange: (adding: boolean) => void;
  addAction: (
    supplierId: string,
    state: BankAccountFormState,
    formData: FormData,
  ) => Promise<BankAccountFormState>;
  deleteAction: (supplierId: string, bankAccountId: string) => Promise<void>;
  setPrimaryAction: (
    supplierId: string,
    bankAccountId: string,
  ) => Promise<void>;
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

export function SupplierBankAccountsPanel({
  supplierId,
  bankAccounts,
  canEdit,
  adding,
  onAddingChange,
  addAction,
  deleteAction,
  setPrimaryAction,
}: SupplierBankAccountsPanelProps) {
  const router = useRouter();
  const boundAddAction = addAction.bind(null, supplierId);
  const [state, formAction, pending] = useActionState(boundAddAction, {});
  const defaultAccountId = useMemo(
    () => pickDefaultBankAccountId(bankAccounts),
    [bankAccounts],
  );
  const [selectedAccountId, setSelectedAccountId] = useState(defaultAccountId);

  useEffect(() => {
    setSelectedAccountId(defaultAccountId);
  }, [defaultAccountId]);

  useEffect(() => {
    if (state.success) {
      onAddingChange(false);
      router.refresh();
    }
  }, [state.success, router, onAddingChange]);

  const selectedAccount = bankAccounts.find(
    (account) => account.id === selectedAccountId,
  );

  async function handleDelete(bankAccountId: string) {
    await deleteAction(supplierId, bankAccountId);
    router.refresh();
  }

  async function handleSetPrimary(bankAccountId: string) {
    await setPrimaryAction(supplierId, bankAccountId);
    router.refresh();
  }

  if (adding) {
    return (
      <form action={formAction} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bank_name">Bank name</Label>
            <Input id="bank_name" name="bank_name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account_number">Account number</Label>
            <Input id="account_number" name="account_number" required />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="account_name">Account name</Label>
            <Input id="account_name" name="account_name" required />
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            <input
              id="is_primary"
              name="is_primary"
              type="checkbox"
              className="size-4 rounded border-input"
              defaultChecked={bankAccounts.length === 0}
            />
            <Label htmlFor="is_primary">Primary account for payments</Label>
          </div>
        </div>

        {state.error ? (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save account"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onAddingChange(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  if (bankAccounts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No bank accounts yet.
        {canEdit ? " Use Add bank account above to record payout details." : null}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {bankAccounts.length > 1 ? (
        <div className="space-y-2">
          <Label htmlFor="supplier_bank_account">Bank account</Label>
          <select
            id="supplier_bank_account"
            className={selectClassName}
            value={selectedAccountId}
            onChange={(event) => setSelectedAccountId(event.target.value)}
          >
            {bankAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {formatBankAccountLabel(account)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {selectedAccount ? (
        <>
          <dl className="grid gap-4 md:grid-cols-2">
            <Field label="Bank" value={selectedAccount.bank_name} />
            <Field
              label="Account number"
              value={selectedAccount.account_number}
            />
            <Field label="Account name" value={selectedAccount.account_name} />
            <Field
              label="Primary for payments"
              value={selectedAccount.is_primary ? "Yes" : "No"}
            />
          </dl>

          {canEdit ? (
            <div className="flex flex-wrap gap-2">
              {!selectedAccount.is_primary ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetPrimary(selectedAccount.id)}
                >
                  Set as primary
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDelete(selectedAccount.id)}
              >
                Remove account
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
