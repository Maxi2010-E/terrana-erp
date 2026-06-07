import {
  EMPLOYEE_DEPARTMENT_LABELS,
  EMPLOYEE_STATUS_LABELS,
  EMPLOYEE_TYPE_LABELS,
  type EmployeeDepartment,
  type EmployeeStatus,
  type EmployeeType,
} from "@/lib/employees/constants";
import type { Employee } from "@/lib/employees/types";
import { formatNaira } from "@/lib/currency";

type EmployeeOverviewDisplayProps = {
  employee: Employee;
};

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

export function EmployeeOverviewDisplay({
  employee,
}: EmployeeOverviewDisplayProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Personal
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <Field label="Employee ID" value={employee.employee_code} />
          <Field
            label="Status"
            value={EMPLOYEE_STATUS_LABELS[employee.status as EmployeeStatus]}
          />
          <Field label="First name" value={employee.first_name} />
          <Field label="Last name" value={employee.last_name} />
          <Field label="Phone" value={employee.phone ?? "—"} />
          <Field label="Email" value={employee.email ?? "—"} />
          <Field
            label="Address"
            value={employee.address ?? "—"}
            className="sm:col-span-2 lg:col-span-1"
          />
          <Field label="Date hired" value={employee.hire_date} />
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Employment
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <Field
            label="Department"
            value={
              EMPLOYEE_DEPARTMENT_LABELS[employee.department as EmployeeDepartment]
            }
          />
          <Field
            label="Employee type"
            value={EMPLOYEE_TYPE_LABELS[employee.employee_type as EmployeeType]}
          />
          <Field label="Job title" value={employee.job_title} />
          <Field
            label="Monthly salary"
            value={formatNaira(Number(employee.monthly_salary))}
          />
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Guarantor
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <Field label="Full name" value={employee.guarantor_name ?? "—"} />
          <Field label="Phone" value={employee.guarantor_phone ?? "—"} />
          <Field
            label="Address"
            value={employee.guarantor_address ?? "—"}
            className="sm:col-span-2 lg:col-span-1"
          />
        </dl>
      </section>
    </div>
  );
}
