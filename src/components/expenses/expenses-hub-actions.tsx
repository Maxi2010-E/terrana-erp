import { DailyExpenseCreateDialog } from "@/components/expenses/daily-expense-create-dialog";
import { OperationalExpenseCreateDialog } from "@/components/expenses/operational-expense-create-dialog";
import type { ExpenseHubTab } from "@/lib/expenses/hub";
import type { OperationalExpenseType } from "@/lib/expenses/constants";
import { canRecordExpense } from "@/lib/expenses/permissions";
import type { OperationalExpenseLinkOptions } from "@/lib/expenses/types";
import type { AppRole } from "@/lib/roles";

type ExpensesHubActionsProps = {
  activeTab: ExpenseHubTab;
  initialTab: ExpenseHubTab;
  role: AppRole;
  defaultOpenCreate?: boolean;
  defaultOperationalType?: OperationalExpenseType;
  operationalLinkOptions?: OperationalExpenseLinkOptions | null;
};

export function ExpensesHubActions({
  activeTab,
  initialTab,
  role,
  defaultOpenCreate,
  defaultOperationalType,
  operationalLinkOptions = null,
}: ExpensesHubActionsProps) {
  const canRecord = canRecordExpense(role);

  if (!canRecord) {
    return null;
  }

  const openDaily =
    Boolean(defaultOpenCreate) && initialTab === "daily" && activeTab === "daily";
  const openOperational =
    Boolean(defaultOpenCreate) &&
    initialTab === "operational" &&
    activeTab === "operational";

  if (activeTab === "daily") {
    return <DailyExpenseCreateDialog defaultOpen={openDaily} />;
  }

  return (
    <OperationalExpenseCreateDialog
      defaultOpen={openOperational}
      defaultExpenseType={defaultOperationalType}
      initialLinkOptions={operationalLinkOptions}
    />
  );
}
