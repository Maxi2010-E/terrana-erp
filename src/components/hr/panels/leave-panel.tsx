import { LeaveTableClient } from "@/components/hr/panels/leave-table-client";
import { listLeaveRecords } from "@/lib/actions/payroll";
import { formatOfficeDateTime } from "@/lib/office/date";
import type { LeaveListRowDisplay } from "@/lib/payroll/types";
import { hasRole, type AppRole } from "@/lib/roles";

type LeavePanelProps = {
  query: string;
  role: AppRole;
};

export async function LeavePanel({ query, role }: LeavePanelProps) {
  const canApprove = hasRole(role, ["super_admin", "admin"]);
  const rows = await listLeaveRecords();
  const displayRows: LeaveListRowDisplay[] = rows.map((row) => ({
    ...row,
    recordedAtLabel: formatOfficeDateTime(row.recordedAt),
  }));

  return (
    <LeaveTableClient rows={displayRows} query={query} canApprove={canApprove} />
  );
}
