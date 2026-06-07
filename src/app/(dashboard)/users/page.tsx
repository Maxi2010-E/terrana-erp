import { UserStatusBadge } from "@/components/employees/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { UserRoleSelect } from "@/components/users/user-role-select";
import { LinkButton } from "@/components/ui/link-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

function recordLabel(total: number): string {
  if (total === 0) {
    return "No users yet";
  }
  if (total === 1) {
    return "1 user";
  }
  return `${total.toLocaleString()} users`;
}

const HEAD_CELL =
  "px-4 pb-3 pt-1 text-left text-xs font-medium tracking-wide uppercase";
const BODY_CELL = "px-4 py-4 align-middle leading-normal";

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const { role: currentRole, authUser } = await requireHrAdmin();
  const canManageRoles = currentRole === "super_admin";
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
      <PageHeader
        title="Users"
        description="System access accounts — each user must link to an employee."
        meta={recordLabel(total)}
        actions={<LinkButton href="/users/new">Create user</LinkButton>}
      />

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="gap-4 border-b border-border/60 pb-4">
          <form className="flex max-w-md gap-2" method="get">
            <input
              name="q"
              defaultValue={query}
              placeholder="Search by email, username, role…"
              className="flex h-10 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
        </CardHeader>
        <CardContent className="space-y-5 px-4 pb-6 pt-5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground">
                  <th className={HEAD_CELL}>Username</th>
                  <th className={HEAD_CELL}>Employee</th>
                  <th className={HEAD_CELL}>Email</th>
                  <th className={HEAD_CELL}>Role</th>
                  <th className={HEAD_CELL}>Status</th>
                  <th className={HEAD_CELL}>Last login</th>
                  <th className={HEAD_CELL}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-muted-foreground"
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
                      <tr
                        key={user.id}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className={`${BODY_CELL} font-medium`}>
                          {user.username ?? "—"}
                        </td>
                        <td className={BODY_CELL}>
                          {employee
                            ? `${employee.employee_code} — ${employee.first_name} ${employee.last_name}`
                            : "—"}
                        </td>
                        <td className={BODY_CELL}>{user.email}</td>
                        <td className={BODY_CELL}>
                          {canManageRoles && user.id !== authUser?.id ? (
                            <UserRoleSelect
                              userId={user.id}
                              currentRole={user.role as AppRole}
                            />
                          ) : (
                            ROLE_LABELS[user.role as AppRole] ?? user.role
                          )}
                        </td>
                        <td className={BODY_CELL}>
                          <UserStatusBadge status={user.status} />
                        </td>
                        <td className={BODY_CELL}>
                          {formatDateTime(user.last_login)}
                        </td>
                        <td className={BODY_CELL}>
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
