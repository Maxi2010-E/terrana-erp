"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EmployeeFormState } from "@/lib/actions/employees";
import {
  EMPLOYEE_DEPARTMENTS,
  EMPLOYEE_DEPARTMENT_LABELS,
  EMPLOYEE_STATUSES,
  EMPLOYEE_STATUS_LABELS,
  EMPLOYEE_TYPES,
  EMPLOYEE_TYPE_LABELS,
} from "@/lib/employees/constants";
import type { Employee } from "@/lib/employees/types";

const selectClassName =
  "flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type EmployeeFormProps = {
  action: (
    state: EmployeeFormState,
    formData: FormData,
  ) => Promise<EmployeeFormState>;
  employee?: Employee | null;
  submitLabel: string;
  redirectTo?: string;
};

export function EmployeeForm({
  action,
  employee,
  submitLabel,
  redirectTo,
}: EmployeeFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state.success && redirectTo) {
      router.push(redirectTo);
      router.refresh();
    }
  }, [state.success, redirectTo, router]);

  return (
    <form action={formAction} className="space-y-8">
      {employee ? (
        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
          Employee ID:{" "}
          <span className="font-medium">{employee.employee_code}</span>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          Employee ID (e.g. EMP-2026-00001) is assigned automatically when you
          save.
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Personal information
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="first_name">First name</Label>
            <Input
              id="first_name"
              name="first_name"
              required
              defaultValue={employee?.first_name ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last name</Label>
            <Input
              id="last_name"
              name="last_name"
              required
              defaultValue={employee?.last_name ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={employee?.phone ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={employee?.email ?? ""}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              defaultValue={employee?.address ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hire_date">Date hired</Label>
            <Input
              id="hire_date"
              name="hire_date"
              type="date"
              required
              defaultValue={employee?.hire_date ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={employee?.status ?? "active"}
              className={selectClassName}
            >
              {EMPLOYEE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {EMPLOYEE_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Employment
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <select
              id="department"
              name="department"
              defaultValue={employee?.department ?? "administration"}
              className={selectClassName}
            >
              {EMPLOYEE_DEPARTMENTS.map((department) => (
                <option key={department} value={department}>
                  {EMPLOYEE_DEPARTMENT_LABELS[department]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="employee_type">Employee type</Label>
            <select
              id="employee_type"
              name="employee_type"
              defaultValue={employee?.employee_type ?? "administrative"}
              className={selectClassName}
            >
              {EMPLOYEE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {EMPLOYEE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="job_title">Job title</Label>
            <Input
              id="job_title"
              name="job_title"
              required
              defaultValue={employee?.job_title ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="monthly_salary">Monthly salary (NGN)</Label>
            <Input
              id="monthly_salary"
              name="monthly_salary"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={employee?.monthly_salary ?? "0"}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Guarantor
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="guarantor_name">Full name</Label>
            <Input
              id="guarantor_name"
              name="guarantor_name"
              defaultValue={employee?.guarantor_name ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guarantor_phone">Phone</Label>
            <Input
              id="guarantor_phone"
              name="guarantor_phone"
              defaultValue={employee?.guarantor_phone ?? ""}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="guarantor_address">Address</Label>
            <Input
              id="guarantor_address"
              name="guarantor_address"
              defaultValue={employee?.guarantor_address ?? ""}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Documents
        </h2>
        <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Uploads coming next</p>
          <p className="mt-1">
            CV, employment letter, and ID document uploads are planned for the
            next HR update (before Phase 2). The database is already prepared
            for these files.
          </p>
        </div>
      </section>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="text-sm text-emerald-700" role="status">
          Saved successfully. Redirecting…
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
