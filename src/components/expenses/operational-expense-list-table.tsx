import Link from "next/link";

import { ExpenseRowActionsCell } from "@/components/expenses/expense-row-actions-cell";
import { ExpenseRecordStatusBadge } from "@/components/expenses/expense-record-status-badge";
import { formatNaira } from "@/lib/currency";
import {
  EXPENSE_PAYMENT_METHOD_LABELS,
  OPERATIONAL_EXPENSE_TYPE_LABELS,
} from "@/lib/expenses/constants";
import { expenseListHasAnyAction } from "@/lib/expenses/row-actions";
import type { OperationalExpenseListRow } from "@/lib/expenses/types";
import { cn } from "@/lib/utils";

type OperationalExpenseListTableProps = {
  rows: OperationalExpenseListRow[];
  currentUserId: string;
  canApprove: boolean;
  canMarkPaidNow: boolean;
};

const HEAD_CELL =
  "px-4 pb-3 pt-1 text-left text-xs font-medium tracking-wide uppercase";
const BODY_CELL = "px-4 py-4 align-middle leading-normal";
const STICKY_ACTIONS_HEAD = cn(
  HEAD_CELL,
  "sticky right-0 z-10 w-[9.5rem] min-w-[9.5rem] bg-card shadow-[-10px_0_16px_-10px_rgba(0,0,0,0.15)]",
);
const STICKY_ACTIONS_CELL = cn(
  BODY_CELL,
  "sticky right-0 isolate z-10 w-[9.5rem] min-w-[9.5rem] bg-card shadow-[-10px_0_16px_-10px_rgba(0,0,0,0.15)]",
);

export function OperationalExpenseListTable({
  rows,
  currentUserId,
  canApprove,
  canMarkPaidNow,
}: OperationalExpenseListTableProps) {
  const showActionsColumn = expenseListHasAnyAction(
    rows,
    currentUserId,
    canApprove,
    canMarkPaidNow,
    "paid_by",
  );

  return (
    <div className="overflow-x-auto">
      <table
        className={cn(
          "w-full border-collapse text-left text-sm",
          showActionsColumn ? "min-w-[1060px]" : "min-w-[940px]",
        )}
      >
        <thead>
          <tr className="border-b border-border/60 text-muted-foreground">
            <th className={`${HEAD_CELL} min-w-[6.5rem]`}>Date</th>
            <th className={`${HEAD_CELL} min-w-[8rem]`}>Type</th>
            <th className={`${HEAD_CELL} min-w-[10rem]`}>
              Linked record / description
            </th>
            <th className={`${HEAD_CELL} min-w-[4rem]`}>Bags</th>
            <th className={`${HEAD_CELL} min-w-[5.5rem]`}>Rate</th>
            <th className={`${HEAD_CELL} min-w-[5.5rem]`}>Total</th>
            <th className={`${HEAD_CELL} min-w-[5rem]`}>Method</th>
            <th className={`${HEAD_CELL} min-w-[8rem]`}>Status</th>
            <th className={`${HEAD_CELL} min-w-[7rem]`}>Recorded by</th>
            <th className={`${HEAD_CELL} min-w-[7rem]`}>Approved by</th>
            {showActionsColumn ? (
              <th className={STICKY_ACTIONS_HEAD}>Actions</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={showActionsColumn ? 11 : 10}
                className="px-4 py-12 text-center text-muted-foreground"
              >
                No operational expenses found.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border/50 last:border-0"
              >
                <td className={`${BODY_CELL} whitespace-nowrap tabular-nums`}>
                  {row.expense_date}
                </td>
                <td className={BODY_CELL}>
                  {OPERATIONAL_EXPENSE_TYPE_LABELS[row.expense_type]}
                </td>
                <td className={BODY_CELL}>
                  {row.link_href ? (
                    <Link
                      href={row.link_href}
                      className="font-medium text-primary hover:underline"
                    >
                      {row.link_label}
                    </Link>
                  ) : (
                    row.link_label
                  )}
                </td>
                <td className={`${BODY_CELL} tabular-nums`}>{row.bags}</td>
                <td className={`${BODY_CELL} tabular-nums`}>
                  {formatNaira(row.rate_per_bag)}
                </td>
                <td className={`${BODY_CELL} tabular-nums`}>
                  {formatNaira(row.total_amount)}
                </td>
                <td className={BODY_CELL}>
                  {EXPENSE_PAYMENT_METHOD_LABELS[row.payment_method]}
                </td>
                <td className={BODY_CELL}>
                  <ExpenseRecordStatusBadge status={row.status} />
                </td>
                <td className={BODY_CELL} suppressHydrationWarning>
                  {row.paid_by_name ?? "—"}
                </td>
                <td className={BODY_CELL} suppressHydrationWarning>
                  {row.approved_by_name ?? "—"}
                </td>
                {showActionsColumn ? (
                  <td className={STICKY_ACTIONS_CELL}>
                    <ExpenseRowActionsCell
                      expenseId={row.id}
                      expenseKind="operational"
                      status={row.status}
                      initiatorId={row.paid_by}
                      initiatorRole={row.paid_by_role}
                      currentUserId={currentUserId}
                      canApprove={canApprove}
                      canMarkPaidNow={canMarkPaidNow}
                      approveRedirectTo="/expenses?tab=operational&message=approved"
                      paymentRedirectTo="/expenses?tab=operational&message=paid_now"
                    />
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
