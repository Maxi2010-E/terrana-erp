import { HrApproveButton } from "@/components/hr/hr-approve-button";
import { PayrollMarkPaidButton } from "@/components/hr/payroll-mark-paid-button";
import { formatNaira } from "@/lib/currency";
import type { PayrollListRow } from "@/lib/payroll/types";
import { formatOfficeDateTime } from "@/lib/office/date";

type PayrollListTableProps = {
  rows: PayrollListRow[];
  canMarkPaid: boolean;
};

export function PayrollListTable({ rows, canMarkPaid }: PayrollListTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70">
      <table className="w-full min-w-[960px] text-sm">
        <thead className="border-b border-border/70 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Employee</th>
            <th className="px-4 py-3">Base</th>
            <th className="px-4 py-3">Leave</th>
            <th className="px-4 py-3">Bonus</th>
            <th className="px-4 py-3">Advance</th>
            <th className="px-4 py-3">Net pay</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                No payroll records for this month yet. Add employees one at a time.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{row.employeeName}</p>
                  <p className="text-xs text-muted-foreground">{row.employeeCode}</p>
                </td>
                <td className="px-4 py-3">{formatNaira(row.baseSalary)}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.unpaidLeaveDays > 0
                    ? `−${formatNaira(row.leaveDeduction)}`
                    : row.paidLeaveDays > 0
                      ? `${row.paidLeaveDays} paid`
                      : "—"}
                </td>
                <td className="px-4 py-3">{formatNaira(row.bonusTotal)}</td>
                <td className="px-4 py-3">{formatNaira(row.advanceDeduction)}</td>
                <td className="px-4 py-3 font-medium">{formatNaira(row.netPay)}</td>
                <td className="px-4 py-3">
                  <span className="capitalize">{row.status}</span>
                  {row.paidAt ? (
                    <p className="text-xs text-muted-foreground">
                      {formatOfficeDateTime(row.paidAt)}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Recorded {formatOfficeDateTime(row.recordedAt)}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  {canMarkPaid && row.status === "recorded" ? (
                    <PayrollMarkPaidButton lineId={row.id} />
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
