import Link from "next/link";

import { HrEmptyState } from "@/components/hr/hr-empty-state";
import { EmployeeStatusBadge } from "@/components/employees/status-badge";
import { LinkButton } from "@/components/ui/link-button";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { TableViewAction } from "@/components/ui/table-view-action";
import { getEmployeesList } from "@/lib/actions/employees";
import {
  EMPLOYEE_DEPARTMENT_LABELS,
  type EmployeeDepartment,
  type EmployeeStatus,
} from "@/lib/employees/constants";
import { Users } from "lucide-react";

type EmployeesPanelProps = {
  page: number;
  query: string;
};

const HEAD_CELL =
  "px-4 pb-3 pt-1 text-left text-xs font-medium tracking-wide uppercase text-muted-foreground";
const BODY_CELL = "px-4 py-4 align-middle leading-normal";

export async function EmployeesPanel({ page, query }: EmployeesPanelProps) {
  const { rows, total } = await getEmployeesList(page, query);

  if (total === 0 && !query) {
    return <HrEmptyState icon={Users} message="No employees recorded." />;
  }

  return (
    <div className="space-y-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border/60">
              <th className={HEAD_CELL}>Employee ID</th>
              <th className={HEAD_CELL}>Name</th>
              <th className={HEAD_CELL}>Department</th>
              <th className={HEAD_CELL}>Position</th>
              <th className={HEAD_CELL}>Status</th>
              <th className={HEAD_CELL}>Date hired</th>
              <th className={HEAD_CELL}>Phone</th>
              <th className={HEAD_CELL}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No employees match your search.
                </td>
              </tr>
            ) : (
              rows.map((employee) => (
                <tr
                  key={employee.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className={`${BODY_CELL} font-medium`}>
                    {employee.employee_code}
                  </td>
                  <td className={BODY_CELL}>
                    {employee.first_name} {employee.last_name}
                  </td>
                  <td className={BODY_CELL}>
                    {
                      EMPLOYEE_DEPARTMENT_LABELS[
                        employee.department as EmployeeDepartment
                      ]
                    }
                  </td>
                  <td className={BODY_CELL}>{employee.job_title}</td>
                  <td className={BODY_CELL}>
                    <EmployeeStatusBadge
                      status={employee.status as EmployeeStatus}
                    />
                  </td>
                  <td className={BODY_CELL}>{employee.hire_date}</td>
                  <td className={BODY_CELL}>{employee.phone ?? "—"}</td>
                  <td className={BODY_CELL}>
                    <div className="flex flex-wrap gap-2">
                      <TableViewAction href={`/hr/employees/${employee.id}`} />
                      <Link
                        href={`/hr/employees/${employee.id}/edit`}
                        className="inline-flex h-7 items-center rounded-lg border border-border bg-background px-2.5 text-xs font-medium hover:bg-muted"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border/60 px-4 py-4">
        <PaginationBar
          page={page}
          total={total}
          pathname="/hr"
          query={{
            tab: "employees",
            q: query || undefined,
          }}
        />
      </div>
    </div>
  );
}

export function EmployeesPanelActions() {
  return <LinkButton href="/hr/employees/new">Add employee</LinkButton>;
}
