"use client";

import { HandCoins } from "lucide-react";

import { HrApproveButton } from "@/components/hr/hr-approve-button";
import { HrEmptyState } from "@/components/hr/hr-empty-state";
import { matchesHrQuery } from "@/components/hr/hr-client-filter";
import { formatNaira } from "@/lib/currency";
import type { AdvanceListRow } from "@/lib/payroll/types";
import { formatOfficeDate } from "@/lib/office/date";

type AdvanceTableClientProps = {
  rows: AdvanceListRow[];
  query: string;
  canApprove: boolean;
};

export function AdvanceTableClient({
  rows,
  query,
  canApprove,
}: AdvanceTableClientProps) {
  const filtered = rows.filter((row) =>
    matchesHrQuery(query, [
      row.employeeName,
      row.employeeCode,
      row.status,
      formatOfficeDate(row.dateIssued),
      formatNaira(row.amount),
      formatNaira(row.balance),
    ]),
  );

  if (rows.length === 0) {
    return <HrEmptyState icon={HandCoins} message="No advances recorded." />;
  }

  if (filtered.length === 0) {
    return (
      <p className="px-4 py-12 text-center text-sm text-muted-foreground">
        No advances match your search.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead className="border-b border-border/70 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Employee</th>
            <th className="px-4 py-3">Date issued</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Balance</th>
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
              <td className="px-4 py-3 text-muted-foreground">
                {formatOfficeDate(row.dateIssued)}
              </td>
              <td className="px-4 py-3">{formatNaira(row.amount)}</td>
              <td className="px-4 py-3">{formatNaira(row.balance)}</td>
              <td className="px-4 py-3 capitalize">
                {row.status.replace("_", " ")}
              </td>
              <td className="px-4 py-3">
                {canApprove && row.status === "pending_approval" ? (
                  <HrApproveButton recordId={row.id} kind="advance" />
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
