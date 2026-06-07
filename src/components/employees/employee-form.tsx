"use client";

import { useActionState, useEffect, useState } from "react";
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

type EmployeeFormFields = {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address: string;
  hire_date: string;
  status: Employee["status"];
  department: Employee["department"];
  employee_type: Employee["employee_type"];
  job_title: string;
  monthly_salary: string;
  guarantor_name: string;
  guarantor_phone: string;
  guarantor_address: string;
};

function buildEmployeeFormFields(employee?: Employee | null): EmployeeFormFields {
  return {
    first_name: employee?.first_name ?? "",
    last_name: employee?.last_name ?? "",
    phone: employee?.phone ?? "",
    email: employee?.email ?? "",
    address: employee?.address ?? "",
    hire_date: employee?.hire_date ?? "",
    status: employee?.status ?? "active",
    department: employee?.department ?? "administration",
    employee_type: employee?.employee_type ?? "administrative",
    job_title: employee?.job_title ?? "",
    monthly_salary:
      employee != null ? String(employee.monthly_salary) : "",
    guarantor_name: employee?.guarantor_name ?? "",
    guarantor_phone: employee?.guarantor_phone ?? "",
    guarantor_address: employee?.guarantor_address ?? "",
  };
}

export function EmployeeForm({
  action,
  employee,
  submitLabel,
  redirectTo,
}: EmployeeFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {});
  const employeeKey = employee?.id ?? "new";
  const [fields, setFields] = useState<EmployeeFormFields>(() =>
    buildEmployeeFormFields(employee),
  );

  useEffect(() => {
    setFields(buildEmployeeFormFields(employee));
  }, [employeeKey]);

  function updateField<K extends keyof EmployeeFormFields>(
    key: K,
    value: EmployeeFormFields[K],
  ) {
    setFields((current) => ({ ...current, [key]: value }));
  }

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
              value={fields.first_name}
              onChange={(event) => updateField("first_name", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last name</Label>
            <Input
              id="last_name"
              name="last_name"
              required
              value={fields.last_name}
              onChange={(event) => updateField("last_name", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              value={fields.phone}
              onChange={(event) => updateField("phone", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={fields.email}
              onChange={(event) => updateField("email", event.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              value={fields.address}
              onChange={(event) => updateField("address", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hire_date">Date hired</Label>
            <Input
              id="hire_date"
              name="hire_date"
              type="date"
              required
              value={fields.hire_date}
              onChange={(event) => updateField("hire_date", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              value={fields.status}
              onChange={(event) =>
                updateField("status", event.target.value as Employee["status"])
              }
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
              value={fields.department}
              onChange={(event) =>
                updateField(
                  "department",
                  event.target.value as Employee["department"],
                )
              }
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
              value={fields.employee_type}
              onChange={(event) =>
                updateField(
                  "employee_type",
                  event.target.value as Employee["employee_type"],
                )
              }
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
              value={fields.job_title}
              onChange={(event) => updateField("job_title", event.target.value)}
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
              value={fields.monthly_salary}
              onChange={(event) =>
                updateField("monthly_salary", event.target.value)
              }
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
              value={fields.guarantor_name}
              onChange={(event) =>
                updateField("guarantor_name", event.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guarantor_phone">Phone</Label>
            <Input
              id="guarantor_phone"
              name="guarantor_phone"
              value={fields.guarantor_phone}
              onChange={(event) =>
                updateField("guarantor_phone", event.target.value)
              }
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="guarantor_address">Address</Label>
            <Input
              id="guarantor_address"
              name="guarantor_address"
              value={fields.guarantor_address}
              onChange={(event) =>
                updateField("guarantor_address", event.target.value)
              }
            />
          </div>
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
