import { NotificationBanner } from "@/components/layout/notification-banner";
import { getExpensesHubNotificationSnapshot } from "@/lib/actions/expenses";
import type { ExpenseHubTab } from "@/lib/expenses/hub";
import {
  canApproveExpense,
  canMarkExpensePaidNow,
} from "@/lib/expenses/permissions";
import {
  expenseTabPendingCount,
  expenseTabReadyCount,
  formatDailyExpenseUrgentBanner,
  formatExpenseApprovedAwaitingPaymentBanner,
  formatExpenseSubmittedPendingBanner,
  formatOperationalExpenseUrgentBanner,
} from "@/lib/expenses/notifications";
import type { AppRole } from "@/lib/roles";

export async function loadExpensesHubNotifications(role: AppRole) {
  const { dailyCounts, operationalCounts } =
    await getExpensesHubNotificationSnapshot();
  const canApprove = canApproveExpense(role);
  const canMarkPaidNow = canMarkExpensePaidNow(role);

  const tabPendingCounts: Partial<Record<ExpenseHubTab, number>> = {
    daily: expenseTabPendingCount("daily", dailyCounts, operationalCounts, role),
    operational: expenseTabPendingCount(
      "operational",
      dailyCounts,
      operationalCounts,
      role,
    ),
  };

  const tabReadyCounts: Partial<Record<ExpenseHubTab, number>> = canMarkPaidNow
    ? {
        daily: expenseTabReadyCount("daily", dailyCounts, operationalCounts),
        operational: expenseTabReadyCount(
          "operational",
          dailyCounts,
          operationalCounts,
        ),
      }
    : {};

  const dailyUrgentBanner = canApprove
    ? formatDailyExpenseUrgentBanner(dailyCounts.pendingApproval)
    : null;
  const operationalUrgentBanner = canApprove
    ? formatOperationalExpenseUrgentBanner(operationalCounts.pendingApproval)
    : null;
  const submittedPendingTotal =
    dailyCounts.submittedPending + operationalCounts.submittedPending;
  const submittedPendingBanner = !canApprove
    ? formatExpenseSubmittedPendingBanner(submittedPendingTotal)
    : null;

  const approvedAwaitingTotal =
    dailyCounts.approvedAwaitingPayment +
    operationalCounts.approvedAwaitingPayment;
  const readyBanner = canMarkPaidNow
    ? formatExpenseApprovedAwaitingPaymentBanner(approvedAwaitingTotal)
    : null;

  const banners =
    dailyUrgentBanner ||
    operationalUrgentBanner ||
    submittedPendingBanner ||
    readyBanner ? (
      <div className="space-y-3">
        {dailyUrgentBanner ? (
          <NotificationBanner urgency="urgent">
            {dailyUrgentBanner}
          </NotificationBanner>
        ) : null}
        {operationalUrgentBanner ? (
          <NotificationBanner urgency="urgent">
            {operationalUrgentBanner}
          </NotificationBanner>
        ) : null}
        {submittedPendingBanner ? (
          <NotificationBanner urgency="urgent">
            {submittedPendingBanner}
          </NotificationBanner>
        ) : null}
        {readyBanner ? (
          <NotificationBanner urgency="ready">{readyBanner}</NotificationBanner>
        ) : null}
      </div>
    ) : null;

  return { tabPendingCounts, tabReadyCounts, banners };
}
