import { DailyExpenseListTable } from "@/components/expenses/daily-expense-list-table";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { getDailyExpensesList } from "@/lib/actions/expenses";
import type { ExpenseRecordStatus } from "@/lib/expenses/constants";
import {
  canApproveExpense,
  canMarkExpensePaidNow,
} from "@/lib/expenses/permissions";
import type { AppRole } from "@/lib/roles";

type DailyExpensesPanelProps = {
  page: number;
  query: string;
  status?: ExpenseRecordStatus;
  role: AppRole;
  currentUserId: string;
};

export async function DailyExpensesPanel({
  page,
  query,
  status,
  role,
  currentUserId,
}: DailyExpensesPanelProps) {
  const canApprove = canApproveExpense(role);
  const canMarkPaidNow = canMarkExpensePaidNow(role);
  const { rows, total } = await getDailyExpensesList(page, query, status);

  return (
    <div className="space-y-0">
      <p className="border-b border-border/60 px-4 py-4 text-sm text-muted-foreground">
        Accounts submit for admin approval, then pay from petty cash and click
        Paid now. Admin entries skip approval and are recorded as paid
        immediately.
      </p>
      <DailyExpenseListTable
        rows={rows}
        currentUserId={currentUserId}
        canApprove={canApprove}
        canMarkPaidNow={canMarkPaidNow}
      />
      <div className="border-t border-border/60 px-4 py-4">
        <PaginationBar
          page={page}
          total={total}
          pathname="/expenses"
          query={{
            tab: "daily",
            q: query || undefined,
            status: status || undefined,
          }}
        />
      </div>
    </div>
  );
}
