import type { AppRole } from "@/lib/roles";
import {
  type DualNotificationCounts,
  hasDualNotifications,
} from "@/lib/notifications/dual-badges";

export type ProcurementNotifications = {
  pendingApproval: number;
  needsPrice: number;
  readyToApprove: number;
  submittedPending: number;
};

/** @deprecated Use ProcurementNotifications */
export type ProcurementAdminNotifications = ProcurementNotifications;

export const EMPTY_PROCUREMENT_NOTIFICATIONS: ProcurementNotifications = {
  pendingApproval: 0,
  needsPrice: 0,
  readyToApprove: 0,
  submittedPending: 0,
};

export function procurementSidebarBadges(
  notifications: ProcurementNotifications,
  role: AppRole,
): DualNotificationCounts {
  if (role === "super_admin" || role === "admin") {
    return {
      urgent: notifications.readyToApprove,
      pending: notifications.needsPrice,
    };
  }

  return {
    urgent: 0,
    pending: notifications.submittedPending,
  };
}

export function hasProcurementSidebarAlert(
  notifications: ProcurementNotifications,
  role: AppRole,
): boolean {
  return hasDualNotifications(procurementSidebarBadges(notifications, role));
}

/** @deprecated Use hasProcurementSidebarAlert */
export function hasProcurementAdminNotifications(
  notifications: ProcurementNotifications,
): boolean {
  return notifications.pendingApproval > 0;
}

export function formatProcurementNotificationTitle(
  notifications: ProcurementNotifications,
  role: AppRole,
): string {
  const badges = procurementSidebarBadges(notifications, role);
  const parts: string[] = [];

  if (badges.urgent > 0) {
    parts.push(
      badges.urgent === 1
        ? "1 batch ready to approve"
        : `${badges.urgent.toLocaleString()} batches ready to approve`,
    );
  }

  if (badges.pending > 0) {
    if (role === "super_admin" || role === "admin") {
      parts.push(
        badges.pending === 1
          ? "1 batch needs unit price"
          : `${badges.pending.toLocaleString()} batches need unit price`,
      );
    } else {
      parts.push(
        badges.pending === 1
          ? "1 batch waiting for admin approval"
          : `${badges.pending.toLocaleString()} batches waiting for admin approval`,
      );
    }
  }

  return parts.join(" · ");
}

export function formatProcurementUrgentBanner(
  notifications: ProcurementNotifications,
): string | null {
  if (notifications.readyToApprove === 0) {
    return null;
  }

  return notifications.readyToApprove === 1
    ? "1 batch ready to approve — action required to unblock procurement."
    : `${notifications.readyToApprove.toLocaleString()} batches ready to approve — action required to unblock procurement.`;
}

export function formatProcurementAwarenessBanner(
  notifications: ProcurementNotifications,
): string | null {
  if (notifications.needsPrice === 0) {
    return null;
  }

  return notifications.needsPrice === 1
    ? "1 batch needs unit price before it can be approved."
    : `${notifications.needsPrice.toLocaleString()} batches need unit price before they can be approved.`;
}

export function formatProcurementSubmittedPendingBanner(
  count: number,
): string | null {
  if (count <= 0) {
    return null;
  }

  return count === 1
    ? "You have 1 procurement batch waiting for admin approval."
    : `You have ${count.toLocaleString()} procurement batches waiting for admin approval.`;
}

export function canReceiveProcurementNotifications(role: AppRole): boolean {
  return role === "super_admin" || role === "admin" || role === "accounts";
}

/** @deprecated Use canReceiveProcurementNotifications */
export function canReceiveProcurementAdminNotifications(role: AppRole): boolean {
  return role === "super_admin" || role === "admin";
}
