import { UserStatusBadge } from "@/components/employees/status-badge";
import { LinkButton } from "@/components/ui/link-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { getUsersList, updateUserStatus } from "@/lib/actions/users";
import { requireHrAdmin } from "@/lib/auth/require-role";
import { ROLE_LABELS, type AppRole } from "@/lib/roles";

type UsersPageProps = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const { role: currentRole } = await requireHrAdmin();
  const canResetSuperAdmin = currentRole === "super_admin";
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const query = params.q ?? "";
  const { rows, total } = await getUsersList(page, query);

  async function toggleUserStatus(formData: FormData) {
    "use server";
    const userId = String(formData.get("user_id") ?? "");
    const nextStatus = String(formData.get("next_status") ?? "");
    await updateUserStatus(userId, nextStatus);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            System access accounts — each user must link to an employee.
          </p>
        </div>
        <LinkButton href="/users/new">Create user</LinkButton>
      </div>

      <Card>
        <CardHeader className="gap-4 pb-4">
          <CardTitle className="text-base">User list</CardTitle>
          <form className="flex max-w-md gap-2" method="get">
            <input
              name="q"
              defaultValue={query}
              placeholder="Search by email, username, role…"
              className="flex h-8 flex-1 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button type="submit" variant="outline" size="sm">
              Search
            </Button>
          </form>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Username</th>
                  <th className="pb-3 pr-4 font-medium">Employee</th>
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium">Role</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Last login</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  rows.map((user) => {
                    const employeeData = user.employees;
                    const employee = Array.isArray(employeeData)
                      ? employeeData[0]
                      : employeeData;
                    const isActive = user.status === "active";
                    const isSuperAdmin = user.role === "super_admin";

                    return (
                      <tr key={user.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">
                          {user.username ?? "—"}
                        </td>
                        <td className="py-3 pr-4">
                          {employee
                            ? `${employee.employee_code} — ${employee.first_name} ${employee.last_name}`
                            : "—"}
                        </td>
                        <td className="py-3 pr-4">{user.email}</td>
                        <td className="py-3 pr-4">
                          {ROLE_LABELS[user.role as AppRole] ?? user.role}
                        </td>
                        <td className="py-3 pr-4">
                          <UserStatusBadge status={user.status} />
                        </td>
                        <td className="py-3 pr-4">
                          {formatDateTime(user.last_login)}
                        </td>
                        <td className="py-3">
                          {isSuperAdmin ? (
                            canResetSuperAdmin ? (
                              <LinkButton
                                href={`/users/${user.id}/reset-password`}
                                variant="outline"
                                size="sm"
                              >
                                Reset password
                              </LinkButton>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <LinkButton
                                href={`/users/${user.id}/reset-password`}
                                variant="outline"
                                size="sm"
                              >
                                Reset password
                              </LinkButton>
                              <form action={toggleUserStatus}>
                                <input
                                  type="hidden"
                                  name="user_id"
                                  value={user.id}
                                />
                                <input
                                  type="hidden"
                                  name="next_status"
                                  value={isActive ? "disabled" : "active"}
                                />
                                <Button
                                  type="submit"
                                  variant="outline"
                                  size="sm"
                                >
                                  {isActive ? "Disable" : "Enable"}
                                </Button>
                              </form>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <PaginationBar
            page={page}
            total={total}
            pathname="/users"
            query={{ q: query || undefined }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
