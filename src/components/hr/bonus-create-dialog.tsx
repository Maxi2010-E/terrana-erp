"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { EmployeeSelectField } from "@/components/hr/employee-select-field";
import { hrFieldClassName } from "@/components/hr/hr-form-styles";
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
import { createBonusRecord, type PayrollSelectEmployee } from "@/lib/actions/payroll";
import { officeLocalDate } from "@/lib/office/date";

type BonusCreateDialogProps = {
  employees: PayrollSelectEmployee[];
  payPeriod: string;
};

export function BonusCreateDialog({
  employees,
  payPeriod,
}: BonusCreateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);
    startTransition(async () => {
      try {
        await createBonusRecord(formData);
        setOpen(false);
        form.reset();
        router.refresh();
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Could not record bonus.",
        );
      }
    });
  }

  return (
    <>
      <Button type="button" size="lg" onClick={() => setOpen(true)}>
        <Plus />
        Add bonus
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record bonus</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="pay_period" value={payPeriod.slice(0, 7)} />
              <div className="space-y-2">
                <Label htmlFor="bonus_employee">Employee</Label>
                <EmployeeSelectField employees={employees} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bonus_amount">Amount (NGN)</Label>
                  <Input
                    id="bonus_amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bonus_date">Bonus date</Label>
                  <input
                    id="bonus_date"
                    type="date"
                    name="bonus_date"
                    defaultValue={officeLocalDate()}
                    required
                    className={hrFieldClassName}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bonus_reason">Reason (optional)</Label>
                <input
                  id="bonus_reason"
                  name="reason"
                  className={hrFieldClassName}
                />
              </div>
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save bonus"}
              </Button>
            </form>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
