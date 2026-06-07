import type { AppRole } from "@/lib/roles";
import type { OperationalExpenseType } from "@/lib/expenses/constants";
import { OPERATIONAL_EXPENSE_TYPES } from "@/lib/expenses/constants";
import {
  type DualNotificationCounts,
  hasDualNotifications,
} from "@/lib/notifications/dual-badges";

export type ExpenseNotifications = {
  /** All expenses awaiting admin approval (admin view). */
  pendingApproval: number;
  /** Expenses the current user recorded that are still pending (accounts view). */
  submittedPending: number;
};

export type ExpensePageNotificationCounts = {
  pendingApproval: number;
  submittedPending: number;
  /** Approved by admin — staff must mark payment made before cash counts. */
  approvedAwaitingPayment: number;
};

export type OperationalExpensePendingByType = Record<
  OperationalExpenseType,
  number
>;

export function emptyOperationalPendingByType(): OperationalExpensePendingByType {
  return Object.fromEntries(
    OPERATIONAL_EXPENSE_TYPES.map((type) => [type, 0]),
  ) as OperationalExpensePendingByType;
}

export type OperationalExpenseNotificationCounts = ExpensePageNotificationCounts & {
  cleaningAwaitingRecord: number;
  gradingAwaitingRecord: number;
  fieldTransferOutAwaitingRecord: number;
  fieldTransferInAwaitingRecord: number;
  truckOffloadingAwaitingRecord: number;
  /** Pending approval counts split by expense type (role-aware). */
  pendingApprovalByType: OperationalExpensePendingByType;
};

export const EMPTY_EXPENSE_NOTIFICATIONS: ExpenseNotifications = {
  pendingApproval: 0,
  submittedPending: 0,
};

export const EMPTY_EXPENSE_PAGE_NOTIFICATIONS: ExpensePageNotificationCounts = {
  pendingApproval: 0,
  submittedPending: 0,
  approvedAwaitingPayment: 0,
};

export const EMPTY_OPERATIONAL_EXPENSE_NOTIFICATIONS: OperationalExpenseNotificationCounts =
  {
    pendingApproval: 0,
    submittedPending: 0,
    approvedAwaitingPayment: 0,
    cleaningAwaitingRecord: 0,
    gradingAwaitingRecord: 0,
    fieldTransferOutAwaitingRecord: 0,
    fieldTransferInAwaitingRecord: 0,
    truckOffloadingAwaitingRecord: 0,
    pendingApprovalByType: emptyOperationalPendingByType(),
  };

export function getOperationalPendingApprovalCount(
  counts: OperationalExpenseNotificationCounts,
  type: OperationalExpenseType,
): number {
  return counts.pendingApprovalByType[type] ?? 0;
}

export function operationalExpensesAwaitingRecordTotal(
  counts: OperationalExpenseNotificationCounts,
): number {
  return (
    counts.cleaningAwaitingRecord +
    counts.gradingAwaitingRecord +
    counts.fieldTransferOutAwaitingRecord +
    counts.fieldTransferInAwaitingRecord +
    counts.truckOffloadingAwaitingRecord
  );
}

export function canReceiveExpenseNotifications(role: AppRole): boolean {
  return (
    role === "super_admin" ||
    role === "admin" ||
    role === "warehouse_manager" ||
    role === "cash_manager"
  );
}

export function expenseSidebarBadges(
  notifications: ExpenseNotifications,
  role: AppRole,
): DualNotificationCounts {
  if (role === "super_admin" || role === "admin") {
    return {
      urgent: notifications.pendingApproval,
      pending: 0,
    };
  }

  return {
    urgent: notifications.submittedPending,
    pending: 0,
  };
}

export function hasExpenseSidebarAlert(
  notifications: ExpenseNotifications,
  role: AppRole,
): boolean {
  return hasDualNotifications(expenseSidebarBadges(notifications, role));
}

export function formatExpenseNotificationTitle(
  notifications: ExpenseNotifications,
  role: AppRole,
): string {
  const badges = expenseSidebarBadges(notifications, role);

  if (badges.urgent === 0) {
    return "";
  }

  if (role === "super_admin" || role === "admin") {
    return badges.urgent === 1
      ? "1 expense awaiting approval"
      : `${badges.urgent.toLocaleString()} expenses awaiting approval`;
  }

  return badges.urgent === 1
    ? "1 expense waiting for admin approval"
    : `${badges.urgent.toLocaleString()} expenses waiting for admin approval`;
}

export function formatDailyExpenseUrgentBanner(count: number): string | null {
  if (count <= 0) {
    return null;
  }

  return count === 1
    ? "1 daily expense is awaiting your approval."
    : `${count.toLocaleString()} daily expenses are awaiting your approval.`;
}

export function formatOperationalExpenseUrgentBanner(
  count: number,
): string | null {
  if (count <= 0) {
    return null;
  }

  return count === 1
    ? "1 operational expense is awaiting your approval."
    : `${count.toLocaleString()} operational expenses are awaiting your approval.`;
}

export function formatExpenseSubmittedPendingBanner(count: number): string | null {
  if (count <= 0) {
    return null;
  }

  return count === 1
    ? "You have 1 expense waiting for admin approval."
    : `You have ${count.toLocaleString()} expenses waiting for admin approval.`;
}

export function formatExpenseApprovedAwaitingPaymentBanner(
  count: number,
): string | null {
  if (count <= 0) {
    return null;
  }

  return count === 1
    ? "1 expense is ready for payment — pay from petty cash, then click Paid now in Actions (right side of the table)."
    : `${count.toLocaleString()} expenses are ready for payment — pay from petty cash, then click Paid now in Actions.`;
}

export function formatExpenseApprovedAwaitingPaymentAdminBanner(
  count: number,
): string | null {
  if (count <= 0) {
    return null;
  }

  return count === 1
    ? "1 expense is approved and waiting for staff to confirm payment was made."
    : `${count.toLocaleString()} expenses are approved and waiting for staff to confirm payment was made.`;
}

export function dailyExpenseSidebarBadges(
  counts: ExpensePageNotificationCounts,
  role: AppRole,
): DualNotificationCounts {
  if (role === "super_admin" || role === "admin") {
    return { urgent: counts.pendingApproval, pending: 0, ready: 0 };
  }

  return {
    urgent: counts.submittedPending,
    pending: 0,
    ready: counts.approvedAwaitingPayment,
  };
}

export function operationalExpenseSidebarBadges(
  counts: OperationalExpenseNotificationCounts,
  role: AppRole,
): DualNotificationCounts {
  const approvalBadges = dailyExpenseSidebarBadges(counts, role);

  const ready =
    role === "cash_manager" ? counts.approvedAwaitingPayment : 0;

  return {
    urgent: approvalBadges.urgent,
    pending: operationalExpensesAwaitingRecordTotal(counts),
    ready,
  };
}

export function hasDailyExpenseSidebarAlert(
  counts: ExpensePageNotificationCounts,
  role: AppRole,
): boolean {
  return hasDualNotifications(dailyExpenseSidebarBadges(counts, role));
}

export function hasOperationalExpenseSidebarAlert(
  counts: OperationalExpenseNotificationCounts,
  role: AppRole,
): boolean {
  return hasDualNotifications(operationalExpenseSidebarBadges(counts, role));
}

export function formatDailyExpenseSidebarTitle(
  counts: ExpensePageNotificationCounts,
  role: AppRole,
): string {
  const badges = dailyExpenseSidebarBadges(counts, role);
  const parts: string[] = [];

  if (badges.urgent > 0) {
    if (role === "super_admin" || role === "admin") {
      parts.push(
        badges.urgent === 1
          ? "1 daily expense awaiting approval"
          : `${badges.urgent.toLocaleString()} daily expenses awaiting approval`,
      );
    } else {
      parts.push(
        badges.urgent === 1
          ? "1 daily expense waiting for admin approval"
          : `${badges.urgent.toLocaleString()} daily expenses waiting for admin approval`,
      );
    }
  }

  const ready = badges.ready ?? 0;
  if (ready > 0) {
    parts.push(
      ready === 1
        ? "1 daily expense approved — mark payment made"
        : `${ready.toLocaleString()} daily expenses approved — mark payment made`,
    );
  }

  return parts.join(" · ");
}

export function formatOperationalExpenseSidebarTitle(
  counts: OperationalExpenseNotificationCounts,
  role: AppRole,
): string {
  const badges = operationalExpenseSidebarBadges(counts, role);
  const parts: string[] = [];

  if (badges.urgent > 0) {
    if (role === "super_admin" || role === "admin") {
      parts.push(
        badges.urgent === 1
          ? "1 operational expense awaiting approval"
          : `${badges.urgent.toLocaleString()} operational expenses awaiting approval`,
      );
    } else {
      parts.push(
        badges.urgent === 1
          ? "1 operational expense waiting for admin approval"
          : `${badges.urgent.toLocaleString()} operational expenses waiting for admin approval`,
      );
    }
  }

  if (badges.pending > 0) {
    parts.push(
      badges.pending === 1
        ? "1 operational cost to record"
        : `${badges.pending.toLocaleString()} operational costs to record`,
    );
  }

  const ready = badges.ready ?? 0;
  if (ready > 0) {
    parts.push(
      ready === 1
        ? "1 operational expense approved — mark payment made"
        : `${ready.toLocaleString()} operational expenses approved — mark payment made`,
    );
  }

  return parts.join(" · ");
}

export function formatOperationalExpensePendingStripTitle(count: number): string {
  return count === 1
    ? "1 operational expense awaiting admin approval"
    : `${count.toLocaleString()} operational expenses awaiting admin approval`;
}

export function formatOperationalExpensePendingStripSubtitle(): string {
  return "Approve submissions first; staff mark Payment made after cash or transfer is released.";
}

export function formatOperationalExpenseSubmittedPendingStripTitle(
  count: number,
): string {
  return count === 1
    ? "1 operational expense waiting for admin approval"
    : `${count.toLocaleString()} operational expenses waiting for admin approval`;
}

/** Single sidebar entry for the expenses hub. */
export function expenseHubSidebarBadges(
  daily: ExpensePageNotificationCounts,
  operational: OperationalExpenseNotificationCounts,
  role: AppRole,
): DualNotificationCounts {
  const dailyBadges = dailyExpenseSidebarBadges(daily, role);
  const operationalBadges = operationalExpenseSidebarBadges(operational, role);

  return {
    urgent: dailyBadges.urgent + operationalBadges.urgent,
    pending: operationalBadges.pending,
    ready:
      (dailyBadges.ready ?? 0) + (operationalBadges.ready ?? 0),
  };
}

export function hasExpenseHubSidebarAlert(
  daily: ExpensePageNotificationCounts,
  operational: OperationalExpenseNotificationCounts,
  role: AppRole,
): boolean {
  return hasDualNotifications(expenseHubSidebarBadges(daily, operational, role));
}

export function formatExpenseHubSidebarTitle(
  daily: ExpensePageNotificationCounts,
  operational: OperationalExpenseNotificationCounts,
  role: AppRole,
): string {
  const badges = expenseHubSidebarBadges(daily, operational, role);
  const parts: string[] = [];

  if (badges.urgent > 0) {
    if (role === "super_admin" || role === "admin") {
      parts.push(
        badges.urgent === 1
          ? "1 expense awaiting approval"
          : `${badges.urgent.toLocaleString()} expenses awaiting approval`,
      );
    } else {
      parts.push(
        badges.urgent === 1
          ? "1 expense waiting for admin approval"
          : `${badges.urgent.toLocaleString()} expenses waiting for admin approval`,
      );
    }
  }

  if (badges.pending > 0) {
    parts.push(
      badges.pending === 1
        ? "1 operational cost to record"
        : `${badges.pending.toLocaleString()} operational costs to record`,
    );
  }

  const ready = badges.ready ?? 0;
  if (ready > 0) {
    parts.push(
      ready === 1
        ? "1 approved — mark payment made"
        : `${ready.toLocaleString()} approved — mark payment made`,
    );
  }

  return parts.join(" · ");
}

export function expenseTabPendingCount(
  tab: "daily" | "operational",
  daily: ExpensePageNotificationCounts,
  operational: OperationalExpenseNotificationCounts,
  role: AppRole,
): number {
  if (tab === "daily") {
    return role === "super_admin" || role === "admin"
      ? daily.pendingApproval
      : daily.submittedPending;
  }

  return role === "super_admin" || role === "admin"
    ? operational.pendingApproval
    : operational.submittedPending;
}

export function expenseTabReadyCount(
  tab: "daily" | "operational",
  daily: ExpensePageNotificationCounts,
  operational: OperationalExpenseNotificationCounts,
): number {
  if (tab === "daily") {
    return daily.approvedAwaitingPayment;
  }

  return operational.approvedAwaitingPayment;
}

export type OperationalExpenseRecordQueueKey = OperationalExpenseType;

export function formatCleaningAwaitingRecordBanner(count: number): string | null {
  if (count <= 0) {
    return null;
  }

  return count === 1
    ? "1 completed processing session needs a cleaning payment recorded."
    : `${count.toLocaleString()} completed processing sessions need cleaning payments recorded.`;
}

export function formatFieldTransferOutAwaitingRecordBanner(
  count: number,
): string | null {
  if (count <= 0) {
    return null;
  }

  return count === 1
    ? "1 completed processing session needs a field transfer out payment recorded."
    : `${count.toLocaleString()} completed processing sessions need field transfer out payments recorded.`;
}

export function formatGradingAwaitingRecordBanner(count: number): string | null {
  if (count <= 0) {
    return null;
  }

  return count === 1
    ? "1 graded inventory batch needs a grading payment recorded."
    : `${count.toLocaleString()} graded inventory batches need grading payments recorded.`;
}
