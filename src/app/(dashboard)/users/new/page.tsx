import { CreateUserForm } from "@/components/users/create-user-form";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAppUser, getEmployeesWithoutUsers } from "@/lib/actions/users";
import { requireHrAdmin } from "@/lib/auth/require-role";

export default async function NewUserPage() {
  await requireHrAdmin();
  const employees = await getEmployeesWithoutUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create user</h1>
          <p className="text-sm text-muted-foreground">
            Select an employee, then assign login credentials and role.
          </p>
        </div>
        <LinkButton variant="outline" href="/users">
          Back to list
        </LinkButton>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">User account</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateUserForm action={createAppUser} employees={employees} />
        </CardContent>
      </Card>
    </div>
  );
}
