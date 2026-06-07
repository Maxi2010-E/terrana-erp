"use client";

import { Gift } from "lucide-react";

import { HrApproveButton } from "@/components/hr/hr-approve-button";
import { HrEmptyState } from "@/components/hr/hr-empty-state";
import { matchesHrQuery } from "@/components/hr/hr-client-filter";
import { formatNaira } from "@/lib/currency";
import type { BonusListRow } from "@/lib/payroll/types";
import { formatOfficeDate } from "@/lib/office/date";

type BonusTableClientProps = {
  rows: BonusListRow[];
  query: string;
  canApprove: boolean;
};

export function BonusTableClient({
  rows,
  query,
  canApprove,
}: BonusTableClientProps) {
  const filtered = rows.filter((row) =>
    matchesHrQuery(query, [
      row.employeeName,
      row.employeeCode,
      row.status,
      formatOfficeDate(row.bonusDate),
      formatNaira(row.amount),
    ]),
  );

  if (rows.length === 0) {
    return <HrEmptyState icon={Gift} message="No bonuses for this month." />;
  }

  if (filtered.length === 0) {
    return (
      <p className="px-4 py-12 text-center text-sm text-muted-foreground">
        No bonuses match your search.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="border-b border-border/70 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Employee</th>
            <th className="px-4 py-3">Bonus date</th>
            <th className="px-4 py-3">Amount</th>
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
                {formatOfficeDate(row.bonusDate)}
              </td>
              <td className="px-4 py-3">{formatNaira(row.amount)}</td>
              <td className="px-4 py-3 capitalize">
                {row.status.replace("_", " ")}
              </td>
              <td className="px-4 py-3">
                {canApprove && row.status === "pending_approval" ? (
                  <HrApproveButton recordId={row.id} kind="bonus" />
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
