import Link from "next/link";

import { EmployeeStatusBadge } from "@/components/employees/status-badge";
import { LinkButton } from "@/components/ui/link-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { getEmployeesList } from "@/lib/actions/employees";
import { requireHrAdmin } from "@/lib/auth/require-role";
import {
  EMPLOYEE_DEPARTMENT_LABELS,
  type EmployeeDepartment,
  type EmployeeStatus,
} from "@/lib/employees/constants";

type EmployeesPageProps = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

export default async function EmployeesPage({ searchParams }: EmployeesPageProps) {
  await requireHrAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const query = params.q ?? "";
  const { rows, total } = await getEmployeesList(page, query);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground">
            Employee master records — no deletes, status changes only.
          </p>
        </div>
        <LinkButton href="/hr/employees/new">Add employee</LinkButton>
      </div>

      <Card>
        <CardHeader className="gap-4 pb-4">
          <CardTitle className="text-base">Employee list</CardTitle>
          <form className="flex max-w-md gap-2" method="get">
            <input
              name="q"
              defaultValue={query}
              placeholder="Search by name, ID, phone, title…"
              className="flex h-8 flex-1 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button type="submit" variant="outline" size="sm">
              Search
            </Button>
          </form>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Employee ID</th>
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Department</th>
                  <th className="pb-3 pr-4 font-medium">Position</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Date hired</th>
                  <th className="pb-3 pr-4 font-medium">Phone</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  rows.map((employee) => (
                    <tr key={employee.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">
                        {employee.employee_code}
                      </td>
                      <td className="py-3 pr-4">
                        {employee.first_name} {employee.last_name}
                      </td>
                      <td className="py-3 pr-4">
                        {
                          EMPLOYEE_DEPARTMENT_LABELS[
                            employee.department as EmployeeDepartment
                          ]
                        }
                      </td>
                      <td className="py-3 pr-4">{employee.job_title}</td>
                      <td className="py-3 pr-4">
                        <EmployeeStatusBadge
                          status={employee.status as EmployeeStatus}
                        />
                      </td>
                      <td className="py-3 pr-4">{employee.hire_date}</td>
                      <td className="py-3 pr-4">{employee.phone ?? "—"}</td>
                      <td className="py-3">
                        <Link
                          href={`/hr/employees/${employee.id}/edit`}
                          className="text-primary hover:underline"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <PaginationBar
            page={page}
            total={total}
            pathname="/hr/employees"
            query={{ q: query || undefined }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
