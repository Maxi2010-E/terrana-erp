"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
import {
  createPayrollLine,
  getEmployeePayrollPreview,
  type PayrollSelectEmployee,
} from "@/lib/actions/payroll";
import { formatNaira } from "@/lib/currency";
import type { EmployeePayrollCalculation } from "@/lib/payroll/types";
import type { EmployeePayrollBlockers } from "@/lib/payroll/hr-notifications";

type PayrollCreateDialogProps = {
  employees: PayrollSelectEmployee[];
  payPeriod: string;
  paidEmployeeIds: string[];
  blockedEmployeeIds?: string[];
};

function PayrollPreviewSummary({
  preview,
}: {
  preview: EmployeePayrollCalculation;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/30 p-4 text-sm">
      <p className="font-medium text-foreground">
        {preview.employeeCode} — {preview.employeeName}
      </p>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Base salary</dt>
          <dd className="font-medium">{formatNaira(preview.baseSalary)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Unpaid leave</dt>
          <dd className="font-medium">
            {preview.unpaidLeaveDays > 0
              ? `${preview.unpaidLeaveDays} day(s) (−${formatNaira(preview.leaveDeduction)})`
              : preview.paidLeaveDays > 0
                ? `${preview.paidLeaveDays} paid day(s)`
                : "None"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Bonuses</dt>
          <dd className="font-medium">{formatNaira(preview.bonusTotal)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Advance deduction</dt>
          <dd className="font-medium">{formatNaira(preview.advanceDeduction)}</dd>
        </div>
        <div className="sm:col-span-2 border-t border-border/60 pt-2">
          <dt className="text-muted-foreground">Net pay</dt>
          <dd className="text-lg font-semibold text-foreground">
            {formatNaira(preview.netPay)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function PayrollCreateDialog({
  employees,
  payPeriod,
  paidEmployeeIds,
  blockedEmployeeIds = [],
}: PayrollCreateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [preview, setPreview] = useState<EmployeePayrollCalculation | null>(null);
  const [blockers, setBlockers] = useState<EmployeePayrollBlockers | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const blockedSet = new Set(blockedEmployeeIds);
  const availableEmployees = employees.filter(
    (employee) =>
      !paidEmployeeIds.includes(employee.id) && !blockedSet.has(employee.id),
  );
  const hiddenBlockedCount = employees.filter(
    (employee) =>
      !paidEmployeeIds.includes(employee.id) && blockedSet.has(employee.id),
  ).length;

  useEffect(() => {
    if (!open || !employeeId) {
      setPreview(null);
      setBlockers(null);
      return;
    }

    let cancelled = false;
    setLoadingPreview(true);
    setError(null);

    getEmployeePayrollPreview(employeeId, payPeriod)
      .then((result) => {
        if (!cancelled) {
          setPreview(result.calculation);
          setBlockers(result.blockers);
          if (result.blockers.blocked) {
            setError(result.blockers.message);
          } else if (!result.calculation) {
            setError("This employee is not eligible for the selected pay month.");
          }
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setPreview(null);
          setBlockers(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load payroll preview.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingPreview(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, employeeId, payPeriod]);

  async function handleSave() {
    if (!employeeId) {
      setError("Select an employee.");
      return;
    }

    if (blockers?.blocked) {
      setError(blockers.message ?? "Payroll is blocked by pending approvals.");
      return;
    }

    setPending(true);
    setError(null);
    const result = await createPayrollLine(employeeId, payPeriod);
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setOpen(false);
    setEmployeeId("");
    setPreview(null);
    setBlockers(null);
    router.refresh();
  }

  return (
    <>
      <Button type="button" size="lg" onClick={() => setOpen(true)}>
        <Plus />
        Add payroll
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add employee payroll</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payroll_employee">Employee</Label>
                <select
                  id="payroll_employee"
                  value={employeeId}
                  onChange={(event) => setEmployeeId(event.target.value)}
                  className={hrFieldClassName}
                >
                  <option value="" disabled>
                    Select employee…
                  </option>
                  {availableEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.employee_code} — {employee.first_name}{" "}
                      {employee.last_name}
                    </option>
                  ))}
                </select>
                {availableEmployees.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {hiddenBlockedCount > 0
                      ? "No employees are available — everyone is either paid or blocked by pending leave, advance, or bonus approvals."
                      : "Every eligible employee is already marked paid for this month."}
                  </p>
                ) : hiddenBlockedCount > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {hiddenBlockedCount === 1
                      ? "1 employee is hidden because they have pending approvals."
                      : `${hiddenBlockedCount} employees are hidden because they have pending approvals.`}
                  </p>
                ) : null}
              </div>

              {loadingPreview ? (
                <p className="text-sm text-muted-foreground">Calculating payroll…</p>
              ) : null}

              {preview ? <PayrollPreviewSummary preview={preview} /> : null}

              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}

              <Button
                type="button"
                disabled={
                  pending ||
                  !preview ||
                  loadingPreview ||
                  Boolean(blockers?.blocked)
                }
                onClick={handleSave}
              >
                {pending ? "Saving…" : "Save payroll"}
              </Button>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
