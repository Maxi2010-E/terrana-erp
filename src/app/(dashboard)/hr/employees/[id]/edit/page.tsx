import Link from "next/link";
import { notFound } from "next/navigation";

import { EmployeeForm } from "@/components/employees/employee-form";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEmployeeById, updateEmployee } from "@/lib/actions/employees";
import { requireHrAdmin } from "@/lib/auth/require-role";
import type { Employee } from "@/lib/employees/types";

type EditEmployeePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditEmployeePage({ params }: EditEmployeePageProps) {
  await requireHrAdmin();
  const { id } = await params;
  const employee = await getEmployeeById(id);

  if (!employee) {
    notFound();
  }

  const boundAction = updateEmployee.bind(null, id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit employee</h1>
          <p className="text-sm text-muted-foreground">
            {employee.employee_code} — {employee.first_name} {employee.last_name}
          </p>
        </div>
        <LinkButton variant="outline" href="/hr/employees">
          Back to list
        </LinkButton>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employee form</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeForm
            action={boundAction}
            employee={employee as Employee}
            submitLabel="Save changes"
            redirectTo="/hr/employees"
          />
        </CardContent>
      </Card>
    </div>
  );
}
