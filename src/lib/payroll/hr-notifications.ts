import type { AppRole } from "@/lib/roles";
import {
  type DualNotificationCounts,
  hasDualNotifications,
} from "@/lib/notifications/dual-badges";

export type PayrollHrNotifications = {
  pendingLeave: number;
  pendingAdvances: number;
  pendingBonuses: number;
  pendingApprovalsTotal: number;
  employeesBlockedByPending: number;
  blockedEmployeeIds: string[];
  unpaidPayrollEmployees: number;
};

export const EMPTY_PAYROLL_HR_NOTIFICATIONS: PayrollHrNotifications = {
  pendingLeave: 0,
  pendingAdvances: 0,
  pendingBonuses: 0,
  pendingApprovalsTotal: 0,
  employeesBlockedByPending: 0,
  blockedEmployeeIds: [],
  unpaidPayrollEmployees: 0,
};

export type EmployeePayrollBlockers = {
  blocked: boolean;
  pendingLeave: number;
  pendingAdvances: number;
  pendingBonuses: number;
  message: string | null;
};

export function canReceivePayrollHrNotifications(role: AppRole): boolean {
  return role === "super_admin" || role === "admin";
}

export function canApprovePayrollHrItems(role: AppRole): boolean {
  return role === "super_admin" || role === "admin";
}

export function buildEmployeePayrollBlockers(input: {
  pendingLeave: number;
  pendingAdvances: number;
  pendingBonuses: number;
}): EmployeePayrollBlockers {
  const blocked =
    input.pendingLeave > 0 ||
    input.pendingAdvances > 0 ||
    input.pendingBonuses > 0;

  if (!blocked) {
    return {
      blocked: false,
      pendingLeave: 0,
      pendingAdvances: 0,
      pendingBonuses: 0,
      message: null,
    };
  }

  const parts: string[] = [];
  if (input.pendingLeave > 0) {
    parts.push(
      input.pendingLeave === 1
        ? "1 leave request"
        : `${input.pendingLeave} leave requests`,
    );
  }
  if (input.pendingAdvances > 0) {
    parts.push(
      input.pendingAdvances === 1
        ? "1 salary advance"
        : `${input.pendingAdvances} salary advances`,
    );
  }
  if (input.pendingBonuses > 0) {
    parts.push(
      input.pendingBonuses === 1
        ? "1 bonus"
        : `${input.pendingBonuses} bonuses`,
    );
  }

  return {
    blocked: true,
    pendingLeave: input.pendingLeave,
    pendingAdvances: input.pendingAdvances,
    pendingBonuses: input.pendingBonuses,
    message: `Payroll cannot be recorded until pending approvals are cleared: ${parts.join(", ")}.`,
  };
}

export function payrollHrSidebarBadges(
  notifications: PayrollHrNotifications,
  role: AppRole,
): DualNotificationCounts {
  if (canApprovePayrollHrItems(role)) {
    return {
      urgent: notifications.employeesBlockedByPending,
      pending: notifications.unpaidPayrollEmployees,
    };
  }

  return {
    urgent: 0,
    pending: notifications.unpaidPayrollEmployees,
  };
}

/** Single sidebar entry for the HR hub — at most urgent + awareness badges. */
export function hrHubSidebarBadges(
  notifications: PayrollHrNotifications,
  role: AppRole,
): DualNotificationCounts {
  if (canApprovePayrollHrItems(role)) {
    return {
      urgent: notifications.pendingApprovalsTotal,
      pending: notifications.unpaidPayrollEmployees,
    };
  }

  return {
    urgent: 0,
    pending: notifications.unpaidPayrollEmployees,
  };
}

export function hasHrHubSidebarAlert(
  notifications: PayrollHrNotifications,
  role: AppRole,
): boolean {
  return hasDualNotifications(hrHubSidebarBadges(notifications, role));
}

export function formatHrHubSidebarTitle(
  notifications: PayrollHrNotifications,
  role: AppRole,
): string {
  const badges = hrHubSidebarBadges(notifications, role);
  const parts: string[] = [];

  if (badges.urgent > 0) {
    parts.push(
      badges.urgent === 1
        ? "1 HR item awaiting approval"
        : `${badges.urgent.toLocaleString()} HR items awaiting approval`,
    );
  }

  if (badges.pending > 0) {
    parts.push(
      badges.pending === 1
        ? "1 employee still unpaid this month"
        : `${badges.pending.toLocaleString()} employees still unpaid this month`,
    );
  }

  return parts.join(" · ");
}

export function hrTabPendingCount(
  tab: "leave" | "advances" | "bonuses",
  notifications: PayrollHrNotifications,
): number {
  if (tab === "leave") {
    return notifications.pendingLeave;
  }
  if (tab === "advances") {
    return notifications.pendingAdvances;
  }
  return notifications.pendingBonuses;
}

export function leaveHrSidebarBadges(
  notifications: PayrollHrNotifications,
  role: AppRole,
): DualNotificationCounts | null {
  if (!canApprovePayrollHrItems(role) || notifications.pendingLeave <= 0) {
    return null;
  }

  return {
    urgent: notifications.pendingLeave,
    pending: 0,
  };
}

export function advanceHrSidebarBadges(
  notifications: PayrollHrNotifications,
  role: AppRole,
): DualNotificationCounts | null {
  if (!canApprovePayrollHrItems(role) || notifications.pendingAdvances <= 0) {
    return null;
  }

  return {
    urgent: notifications.pendingAdvances,
    pending: 0,
  };
}

export function bonusHrSidebarBadges(
  notifications: PayrollHrNotifications,
  role: AppRole,
): DualNotificationCounts | null {
  if (!canApprovePayrollHrItems(role) || notifications.pendingBonuses <= 0) {
    return null;
  }

  return {
    urgent: notifications.pendingBonuses,
    pending: 0,
  };
}

export function hasPayrollHrSidebarAlert(
  notifications: PayrollHrNotifications,
  role: AppRole,
): boolean {
  return hasDualNotifications(payrollHrSidebarBadges(notifications, role));
}

export function formatLeaveHrSidebarTitle(count: number): string {
  return count === 1
    ? "1 leave request awaiting approval"
    : `${count.toLocaleString()} leave requests awaiting approval`;
}

export function formatAdvanceHrSidebarTitle(count: number): string {
  return count === 1
    ? "1 salary advance awaiting approval"
    : `${count.toLocaleString()} salary advances awaiting approval`;
}

export function formatBonusHrSidebarTitle(count: number): string {
  return count === 1
    ? "1 bonus awaiting approval"
    : `${count.toLocaleString()} bonuses awaiting approval`;
}

export function formatPayrollHrSidebarTitle(
  notifications: PayrollHrNotifications,
  role: AppRole,
): string {
  const badges = payrollHrSidebarBadges(notifications, role);
  const parts: string[] = [];

  if (badges.urgent > 0) {
    parts.push(
      badges.urgent === 1
        ? "1 employee blocked by pending approvals"
        : `${badges.urgent.toLocaleString()} employees blocked by pending approvals`,
    );
  }

  if (badges.pending > 0) {
    parts.push(
      badges.pending === 1
        ? "1 employee still unpaid this month"
        : `${badges.pending.toLocaleString()} employees still unpaid this month`,
    );
  }

  return parts.join(" · ");
}

export function formatLeavePendingBanner(count: number): string | null {
  if (count <= 0) {
    return null;
  }

  return count === 1
    ? "1 leave request is awaiting approval — payroll is blocked for that employee until it is approved."
    : `${count.toLocaleString()} leave requests are awaiting approval — payroll is blocked for those employees until they are approved.`;
}

export function formatAdvancePendingBanner(count: number): string | null {
  if (count <= 0) {
    return null;
  }

  return count === 1
    ? "1 salary advance is awaiting approval — payroll is blocked for that employee until it is approved."
    : `${count.toLocaleString()} salary advances are awaiting approval — payroll is blocked for those employees until they are approved.`;
}

export function formatBonusPendingBanner(count: number): string | null {
  if (count <= 0) {
    return null;
  }

  return count === 1
    ? "1 bonus is awaiting approval — payroll is blocked for that employee until it is approved."
    : `${count.toLocaleString()} bonuses are awaiting approval — payroll is blocked for those employees until they are approved.`;
}

export function formatPayrollBlockedBanner(
  notifications: PayrollHrNotifications,
): string | null {
  if (notifications.employeesBlockedByPending <= 0) {
    return null;
  }

  return notifications.employeesBlockedByPending === 1
    ? "1 employee has pending leave, advance, or bonus approvals — payroll cannot be recorded for them until those are approved."
    : `${notifications.employeesBlockedByPending.toLocaleString()} employees have pending leave, advance, or bonus approvals — payroll cannot be recorded for them until those are approved.`;
}

export function formatPayrollUnpaidBanner(count: number): string | null {
  if (count <= 0) {
    return null;
  }

  return count === 1
    ? "1 eligible employee has not been paid this month."
    : `${count.toLocaleString()} eligible employees have not been paid this month.`;
}

export function formatPayrollPendingApprovalsBanner(
  count: number,
): string | null {
  if (count <= 0) {
    return null;
  }

  return count === 1
    ? "1 HR item is awaiting approval across leave, advances, and bonuses."
    : `${count.toLocaleString()} HR items are awaiting approval across leave, advances, and bonuses.`;
}
