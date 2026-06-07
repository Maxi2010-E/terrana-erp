import { OperationalExpenseDashboardCards } from "@/components/expenses/operational-expense-dashboard-cards";
import { getOperationalExpenseNotificationCounts } from "@/lib/actions/expenses";
import type { OperationalExpenseType } from "@/lib/expenses/constants";

type OperationalExpensesToolbarProps = {
  canRecord: boolean;
  canApprove: boolean;
  activeType?: OperationalExpenseType;
  hidePendingStrip: boolean;
};

export async function OperationalExpensesToolbar({
  canRecord,
  canApprove,
  activeType,
  hidePendingStrip,
}: OperationalExpensesToolbarProps) {
  const counts = await getOperationalExpenseNotificationCounts();

  return (
    <div className="mb-6">
      <OperationalExpenseDashboardCards
        counts={counts}
        canRecord={canRecord}
        canApprove={canApprove}
        activeType={activeType}
        hidePendingStrip={hidePendingStrip}
      />
    </div>
  );
}
