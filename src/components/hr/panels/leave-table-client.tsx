"use client";

import { CalendarDays } from "lucide-react";

import { HrApproveButton } from "@/components/hr/hr-approve-button";
import { HrEmptyState } from "@/components/hr/hr-empty-state";
import { matchesHrQuery } from "@/components/hr/hr-client-filter";
import { LEAVE_TYPE_LABELS } from "@/lib/payroll/constants";
import type { LeaveListRowDisplay } from "@/lib/payroll/types";

type LeaveTableClientProps = {
  rows: LeaveListRowDisplay[];
  query: string;
  canApprove: boolean;
};

export function LeaveTableClient({
  rows,
  query,
  canApprove,
}: LeaveTableClientProps) {
  const filtered = rows.filter((row) =>
    matchesHrQuery(query, [
      row.employeeName,
      row.employeeCode,
      LEAVE_TYPE_LABELS[row.leaveType],
      row.status,
      row.startDate,
      row.endDate,
    ]),
  );

  if (rows.length === 0) {
    return <HrEmptyState icon={CalendarDays} message="No leave recorded." />;
  }

  if (filtered.length === 0) {
    return (
      <p className="px-4 py-12 text-center text-sm text-muted-foreground">
        No leave records match your search.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead className="border-b border-border/70 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Employee</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Leave dates</th>
            <th className="px-4 py-3">Recorded</th>
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
              <td className="px-4 py-3">{LEAVE_TYPE_LABELS[row.leaveType]}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {row.startDate} → {row.endDate}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {row.recordedAtLabel}
              </td>
              <td className="px-4 py-3 capitalize">
                {row.status.replace("_", " ")}
              </td>
              <td className="px-4 py-3">
                {canApprove && row.status === "pending_approval" ? (
                  <HrApproveButton recordId={row.id} kind="leave" />
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
