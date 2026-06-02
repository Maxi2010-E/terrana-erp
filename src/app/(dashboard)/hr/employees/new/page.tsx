import { EmployeeForm } from "@/components/employees/employee-form";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createEmployee } from "@/lib/actions/employees";
import { requireHrAdmin } from "@/lib/auth/require-role";

export default async function NewEmployeePage() {
  await requireHrAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Add employee</h1>
          <p className="text-sm text-muted-foreground">
            Employee ID will be generated automatically.
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
            action={createEmployee}
            submitLabel="Create employee"
            redirectTo="/hr/employees"
          />
        </CardContent>
      </Card>
    </div>
  );
}
