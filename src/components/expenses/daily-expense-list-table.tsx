import { ExpenseRowActionsCell } from "@/components/expenses/expense-row-actions-cell";
import { ExpenseRecordStatusBadge } from "@/components/expenses/expense-record-status-badge";
import { formatNaira } from "@/lib/currency";
import {
  DAILY_EXPENSE_CATEGORY_LABELS,
  EXPENSE_PAYMENT_METHOD_LABELS,
} from "@/lib/expenses/constants";
import { expenseListHasAnyAction } from "@/lib/expenses/row-actions";
import type { DailyExpenseListRow } from "@/lib/expenses/types";
import { cn } from "@/lib/utils";

type DailyExpenseListTableProps = {
  rows: DailyExpenseListRow[];
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

export function DailyExpenseListTable({
  rows,
  currentUserId,
  canApprove,
  canMarkPaidNow,
}: DailyExpenseListTableProps) {
  const showActionsColumn = expenseListHasAnyAction(
    rows,
    currentUserId,
    canApprove,
    canMarkPaidNow,
    "entered_by",
  );

  return (
    <div className="overflow-x-auto">
      <table
        className={cn(
          "w-full border-collapse text-left text-sm",
          showActionsColumn ? "min-w-[920px]" : "min-w-[800px]",
        )}
      >
        <thead>
          <tr className="border-b border-border/60 text-muted-foreground">
            <th className={`${HEAD_CELL} min-w-[6.5rem]`}>Date</th>
            <th className={`${HEAD_CELL} min-w-[7rem]`}>Category</th>
            <th className={`${HEAD_CELL} min-w-[12rem]`}>Description</th>
            <th className={`${HEAD_CELL} min-w-[5.5rem]`}>Amount</th>
            <th className={`${HEAD_CELL} min-w-[5rem]`}>Method</th>
            <th className={`${HEAD_CELL} min-w-[8rem]`}>Status</th>
            <th className={`${HEAD_CELL} min-w-[7rem]`}>Entered by</th>
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
                colSpan={showActionsColumn ? 9 : 8}
                className="px-4 py-12 text-center text-muted-foreground"
              >
                No daily expenses found.
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
                  {DAILY_EXPENSE_CATEGORY_LABELS[row.expense_category]}
                </td>
                <td className={BODY_CELL}>
                  <div className="font-medium">{row.description}</div>
                  {row.notes ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {row.notes}
                    </div>
                  ) : null}
                </td>
                <td className={`${BODY_CELL} tabular-nums`}>
                  {formatNaira(row.amount)}
                </td>
                <td className={BODY_CELL}>
                  {EXPENSE_PAYMENT_METHOD_LABELS[row.payment_method]}
                </td>
                <td className={BODY_CELL}>
                  <ExpenseRecordStatusBadge status={row.status} />
                </td>
                <td className={BODY_CELL} suppressHydrationWarning>
                  {row.entered_by_name ?? "—"}
                </td>
                <td className={BODY_CELL} suppressHydrationWarning>
                  {row.approved_by_name ?? "—"}
                </td>
                {showActionsColumn ? (
                  <td className={STICKY_ACTIONS_CELL}>
                    <ExpenseRowActionsCell
                      expenseId={row.id}
                      expenseKind="daily"
                      status={row.status}
                      initiatorId={row.entered_by}
                      initiatorRole={row.entered_by_role}
                      currentUserId={currentUserId}
                      canApprove={canApprove}
                      canMarkPaidNow={canMarkPaidNow}
                      approveRedirectTo="/expenses?tab=daily&message=approved"
                      paymentRedirectTo="/expenses?tab=daily&message=paid_now"
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
