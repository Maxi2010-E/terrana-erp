import { PayrollTableClient } from "@/components/hr/panels/payroll-table-client";
import { listPayrollLines } from "@/lib/actions/payroll";
import { formatOfficeDateTime } from "@/lib/office/date";
import type { PayrollListRowDisplay } from "@/lib/payroll/types";
import { hasRole, type AppRole } from "@/lib/roles";

type PayrollPanelProps = {
  payPeriod: string;
  query: string;
  role: AppRole;
};

export async function PayrollPanel({
  payPeriod,
  query,
  role,
}: PayrollPanelProps) {
  const canMarkPaid = hasRole(role, ["super_admin", "admin"]);
  const rows = await listPayrollLines(payPeriod);
  const displayRows: PayrollListRowDisplay[] = rows.map((row) => ({
    ...row,
    paidAtLabel: row.paidAt ? formatOfficeDateTime(row.paidAt) : null,
    recordedAtLabel: formatOfficeDateTime(row.recordedAt),
  }));

  return (
    <PayrollTableClient
      rows={displayRows}
      query={query}
      canMarkPaid={canMarkPaid}
    />
  );
}
