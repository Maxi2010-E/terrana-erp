import type { EmployeeOption } from "@/lib/employees/types";

type EmployeeSelectFieldProps = {
  employees: EmployeeOption[];
  name?: string;
  required?: boolean;
};

export function EmployeeSelectField({
  employees,
  name = "employee_id",
  required = true,
}: EmployeeSelectFieldProps) {
  return (
    <select
      name={name}
      required={required}
      className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
    >
      <option value="" disabled>
        Select employee…
      </option>
      {employees.map((employee) => (
        <option key={employee.id} value={employee.id}>
          {employee.employee_code} — {employee.first_name} {employee.last_name}
        </option>
      ))}
    </select>
  );
}
