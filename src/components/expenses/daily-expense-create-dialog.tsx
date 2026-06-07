"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDailyExpense } from "@/lib/actions/expenses";
import {
  DAILY_EXPENSE_CATEGORIES,
  DAILY_EXPENSE_CATEGORY_LABELS,
  EXPENSE_PAYMENT_METHODS,
  EXPENSE_PAYMENT_METHOD_LABELS,
} from "@/lib/expenses/constants";

const selectClassName =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const textareaClassName =
  "flex min-h-20 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type DailyExpenseCreateDialogProps = {
  defaultOpen?: boolean;
};

export function DailyExpenseCreateDialog({
  defaultOpen = false,
}: DailyExpenseCreateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [category, setCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  useEffect(() => {
    if (defaultOpen) {
      setOpen(true);
    }
  }, [defaultOpen]);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("expense_category", category);
    formData.set("payment_method", paymentMethod);

    const result = await createDailyExpense(formData);
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setOpen(false);
    router.push("/expenses?tab=daily&message=created");
    router.refresh();
  }

  return (
    <>
      <Button type="button" size="lg" onClick={() => setOpen(true)}>
        <Plus />
        Add expense
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add daily expense</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="daily_expense_date">Date</Label>
                <Input
                  id="daily_expense_date"
                  name="expense_date"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="daily_category">Category</Label>
                <select
                  id="daily_category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className={selectClassName}
                  required
                >
                  <option value="">Select category</option>
                  {DAILY_EXPENSE_CATEGORIES.map((value) => (
                    <option key={value} value={value}>
                      {DAILY_EXPENSE_CATEGORY_LABELS[value]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="daily_description">Description</Label>
                <Input id="daily_description" name="description" required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="daily_amount">Amount</Label>
                  <Input
                    id="daily_amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="daily_payment_method">Payment method</Label>
                  <select
                    id="daily_payment_method"
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    className={selectClassName}
                  >
                    {EXPENSE_PAYMENT_METHODS.map((value) => (
                      <option key={value} value={value}>
                        {EXPENSE_PAYMENT_METHOD_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="daily_notes">Notes</Label>
                <textarea
                  id="daily_notes"
                  name="notes"
                  rows={3}
                  className={textareaClassName}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Cash expenses reduce petty cash when approved by an admin.
              </p>
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              <Button
                type="submit"
                disabled={pending || !category}
                className="w-full"
              >
                {pending ? "Saving…" : "Submit for approval"}
              </Button>
            </form>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
