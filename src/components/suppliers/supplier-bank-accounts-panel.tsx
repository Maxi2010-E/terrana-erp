"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BankAccountFormState } from "@/lib/actions/suppliers";
import type { SupplierBankAccount } from "@/lib/suppliers/types";

type SupplierBankAccountsPanelProps = {
  supplierId: string;
  bankAccounts: SupplierBankAccount[];
  canEdit: boolean;
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

export function SupplierBankAccountsPanel({
  supplierId,
  bankAccounts,
  canEdit,
  addAction,
  deleteAction,
  setPrimaryAction,
}: SupplierBankAccountsPanelProps) {
  const router = useRouter();
  const boundAddAction = addAction.bind(null, supplierId);
  const [state, formAction, pending] = useActionState(boundAddAction, {});

  useEffect(() => {
    if (state.success) {
      router.push("/suppliers?message=bank_added");
      router.refresh();
    }
  }, [state.success, router]);

  async function handleDelete(bankAccountId: string) {
    await deleteAction(supplierId, bankAccountId);
    router.refresh();
  }

  async function handleSetPrimary(bankAccountId: string) {
    await setPrimaryAction(supplierId, bankAccountId);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="pb-3 pr-4 font-medium">Bank</th>
              <th className="pb-3 pr-4 font-medium">Account number</th>
              <th className="pb-3 pr-4 font-medium">Account name</th>
              <th className="pb-3 pr-4 font-medium">Primary</th>
              {canEdit ? (
                <th className="pb-3 font-medium">Actions</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {bankAccounts.length === 0 ? (
              <tr>
                <td
                  colSpan={canEdit ? 5 : 4}
                  className="py-6 text-center text-muted-foreground"
                >
                  No bank accounts yet.
                </td>
              </tr>
            ) : (
              bankAccounts.map((account) => (
                <tr key={account.id} className="border-b last:border-0">
                  <td className="py-3 pr-4">{account.bank_name}</td>
                  <td className="py-3 pr-4 font-mono text-xs">
                    {account.account_number}
                  </td>
                  <td className="py-3 pr-4">{account.account_name}</td>
                  <td className="py-3 pr-4">
                    {account.is_primary ? "Yes" : "—"}
                  </td>
                  {canEdit ? (
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        {!account.is_primary ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetPrimary(account.id)}
                          >
                            Set primary
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(account.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {canEdit ? (
        <form action={formAction} className="space-y-4 rounded-lg border p-4">
          <p className="text-sm font-medium">Add bank account</p>
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
              />
              <Label htmlFor="is_primary">Primary account for payments</Label>
            </div>
          </div>

          {state.error ? (
            <p
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {state.error}
            </p>
          ) : null}

          <Button type="submit" disabled={pending}>
            {pending ? "Adding…" : "Add account"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
