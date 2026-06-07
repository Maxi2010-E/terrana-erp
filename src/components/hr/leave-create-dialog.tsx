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
import { Label } from "@/components/ui/label";
import { createLeaveRecord } from "@/lib/actions/payroll";
import { LEAVE_TYPE_LABELS, LEAVE_TYPES } from "@/lib/payroll/constants";
import type { PayrollSelectEmployee } from "@/lib/actions/payroll";

type LeaveCreateDialogProps = {
  employees: PayrollSelectEmployee[];
};

export function LeaveCreateDialog({ employees }: LeaveCreateDialogProps) {
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
        await createLeaveRecord(formData);
        setOpen(false);
        form.reset();
        router.refresh();
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Could not record leave.",
        );
      }
    });
  }

  return (
    <>
      <Button type="button" size="lg" onClick={() => setOpen(true)}>
        <Plus />
        Add leave
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record leave</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="leave_employee">Employee</Label>
                <EmployeeSelectField employees={employees} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leave_type">Leave type</Label>
                <select
                  id="leave_type"
                  name="leave_type"
                  className={hrFieldClassName}
                >
                  {LEAVE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {LEAVE_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="leave_start">Start date</Label>
                  <input
                    id="leave_start"
                    type="date"
                    name="start_date"
                    required
                    className={hrFieldClassName}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leave_end">End date</Label>
                  <input
                    id="leave_end"
                    type="date"
                    name="end_date"
                    required
                    className={hrFieldClassName}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="leave_reason">Reason (optional)</Label>
                <input
                  id="leave_reason"
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
                {pending ? "Saving…" : "Save leave"}
              </Button>
            </form>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
