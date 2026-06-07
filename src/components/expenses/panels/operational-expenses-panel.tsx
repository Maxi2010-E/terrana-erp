import { OperationalExpenseListTable } from "@/components/expenses/operational-expense-list-table";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { getOperationalExpensesList } from "@/lib/actions/expenses";
import type { ExpenseRecordStatus } from "@/lib/expenses/constants";
import {
  canApproveExpense,
  canMarkExpensePaidNow,
} from "@/lib/expenses/permissions";
import type { AppRole } from "@/lib/roles";

type OperationalExpensesPanelProps = {
  page: number;
  query: string;
  status?: ExpenseRecordStatus;
  role: AppRole;
  currentUserId: string;
};

export async function OperationalExpensesPanel({
  page,
  query,
  status,
  role,
  currentUserId,
}: OperationalExpensesPanelProps) {
  const canApprove = canApproveExpense(role);
  const canMarkPaidNow = canMarkExpensePaidNow(role);
  const { rows, total } = await getOperationalExpensesList(page, query, status);

  return (
    <div className="space-y-0">
      <OperationalExpenseListTable
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
            tab: "operational",
            q: query || undefined,
            status: status || undefined,
          }}
        />
      </div>
    </div>
  );
}
