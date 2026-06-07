"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserFormState } from "@/lib/actions/users";
import { EMPLOYEE_DEPARTMENT_LABELS } from "@/lib/employees/constants";
import type { UserEligibleEmployeeOption } from "@/lib/employees/types";
import { APP_ROLES, ROLE_LABELS } from "@/lib/roles";

const selectClassName =
  "flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type CreateUserFormProps = {
  action: (state: UserFormState, formData: FormData) => Promise<UserFormState>;
  employees: UserEligibleEmployeeOption[];
};

export function CreateUserForm({ action, employees }: CreateUserFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {});
  const [employeeId, setEmployeeId] = useState("");

  const selectedEmployee = employees.find(
    (employee) => employee.id === employeeId,
  );

  useEffect(() => {
    if (state.success) {
      router.push("/users");
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="employee_id">Employee</Label>
        <select
          id="employee_id"
          name="employee_id"
          required
          className={selectClassName}
          value={employeeId}
          onChange={(event) => setEmployeeId(event.target.value)}
        >
          <option value="" disabled>
            Select an administrative employee without a user account
          </option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.employee_code} — {employee.first_name}{" "}
              {employee.last_name} (
              {EMPLOYEE_DEPARTMENT_LABELS[employee.department]})
            </option>
          ))}
        </select>
      </div>

      {selectedEmployee ? (
        <div className="space-y-4 rounded-xl border border-border/60 bg-muted/30 p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Login email</p>
            <p className="text-sm text-muted-foreground">
              Taken from the employee record in HR — not editable here.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email_display">Email</Label>
            <Input
              id="email_display"
              type="email"
              readOnly
              value={selectedEmployee.email}
              className="bg-background"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Temporary password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                defaultValue="warehouse_manager"
                className={selectClassName}
              >
                {APP_ROLES.filter((role) => role !== "super_admin").map(
                  (role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>
        </div>
      ) : employees.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          Choose an employee above to set their login password and role.
        </p>
      ) : null}

      {employees.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No eligible employees. Register an active administrative employee with
          an email in HR first, or all eligible employees already have accounts.
        </p>
      ) : null}

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending || employees.length === 0 || !selectedEmployee}
      >
        {pending ? "Creating user…" : "Create user"}
      </Button>
    </form>
  );
}
