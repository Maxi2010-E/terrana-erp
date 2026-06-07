"use client";

import { BadgeDollarSign } from "lucide-react";

import { HrEmptyState } from "@/components/hr/hr-empty-state";
import { matchesHrQuery } from "@/components/hr/hr-client-filter";
import { PayrollMarkPaidButton } from "@/components/hr/payroll-mark-paid-button";
import { PayrollPayslipPreviewDialog } from "@/components/hr/payroll-payslip-preview-dialog";
import { formatNaira } from "@/lib/currency";
import type { PayrollListRowDisplay } from "@/lib/payroll/types";

type PayrollTableClientProps = {
  rows: PayrollListRowDisplay[];
  query: string;
  canMarkPaid: boolean;
};

export function PayrollTableClient({
  rows,
  query,
  canMarkPaid,
}: PayrollTableClientProps) {
  const filtered = rows.filter((row) =>
    matchesHrQuery(query, [
      row.employeeName,
      row.employeeCode,
      row.status,
      formatNaira(row.baseSalary),
      formatNaira(row.netPay),
    ]),
  );

  if (rows.length === 0) {
    return (
      <HrEmptyState
        icon={BadgeDollarSign}
        message="No payroll records for this month. Add employees one at a time."
      />
    );
  }

  if (filtered.length === 0) {
    return (
      <p className="px-4 py-12 text-center text-sm text-muted-foreground">
        No payroll records match your search.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
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
          {filtered.map((row) => (
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
                {row.paidAtLabel ? (
                  <p className="text-xs text-muted-foreground">{row.paidAtLabel}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Recorded {row.recordedAtLabel}
                  </p>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <PayrollPayslipPreviewDialog lineId={row.id} />
                  {canMarkPaid && row.status === "recorded" ? (
                    <PayrollMarkPaidButton lineId={row.id} />
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
