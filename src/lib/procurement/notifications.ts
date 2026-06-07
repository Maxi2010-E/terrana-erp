import type { AppRole } from "@/lib/roles";
import { isAdminRole } from "@/lib/permissions/matrix";
import {
  type DualNotificationCounts,
  hasDualNotifications,
} from "@/lib/notifications/dual-badges";

export type ProcurementNotifications = {
  /** Batches requiring this viewer's action now (red). */
  urgentCount: number;
  /** Waiting on someone else or post-confirmation (yellow). */
  awarenessCount: number;
  /** Final-step batches missing unit price (admin only). */
  needsPrice: number;
  /** Batches the warehouse user submitted awaiting confirmation. */
  submittedPending: number;
};

export const EMPTY_PROCUREMENT_NOTIFICATIONS: ProcurementNotifications = {
  urgentCount: 0,
  awarenessCount: 0,
  needsPrice: 0,
  submittedPending: 0,
};

export function procurementSidebarBadges(
  notifications: ProcurementNotifications,
  role: AppRole,
): DualNotificationCounts {
  if (isAdminRole(role)) {
    return {
      urgent: notifications.urgentCount,
      pending: notifications.awarenessCount + notifications.needsPrice,
    };
  }

  if (role === "cash_manager" || role === "logistics_manager") {
    return {
      urgent: notifications.urgentCount,
      pending: notifications.awarenessCount,
    };
  }

  if (role === "warehouse_manager") {
    return {
      urgent: notifications.submittedPending,
      pending: notifications.awarenessCount,
    };
  }

  return { urgent: 0, pending: 0 };
}

export function hasProcurementSidebarAlert(
  notifications: ProcurementNotifications,
  role: AppRole,
): boolean {
  return hasDualNotifications(procurementSidebarBadges(notifications, role));
}

export function formatProcurementNotificationTitle(
  notifications: ProcurementNotifications,
  role: AppRole,
): string {
  const badges = procurementSidebarBadges(notifications, role);
  const parts: string[] = [];

  if (badges.urgent > 0) {
    if (isAdminRole(role)) {
      parts.push(
        badges.urgent === 1
          ? "1 batch ready for final approval"
          : `${badges.urgent.toLocaleString()} batches ready for final approval`,
      );
    } else if (role === "warehouse_manager") {
      parts.push(
        badges.urgent === 1
          ? "1 batch awaiting confirmation"
          : `${badges.urgent.toLocaleString()} batches awaiting confirmation`,
      );
    } else {
      parts.push(
        badges.urgent === 1
          ? "1 batch to confirm in warehouse"
          : `${badges.urgent.toLocaleString()} batches to confirm in warehouse`,
      );
    }
  }

  if (badges.pending > 0) {
    if (isAdminRole(role)) {
      parts.push(
        badges.pending === 1
          ? "1 batch awaiting warehouse confirmation"
          : `${badges.pending.toLocaleString()} batches awaiting warehouse confirmation`,
      );
    } else if (role === "warehouse_manager") {
      parts.push(
        badges.pending === 1
          ? "1 batch with admin"
          : `${badges.pending.toLocaleString()} batches with admin`,
      );
    } else {
      parts.push(
        badges.pending === 1
          ? "1 batch with admin"
          : `${badges.pending.toLocaleString()} batches with admin`,
      );
    }
  }

  return parts.join(" · ");
}

export function formatProcurementUrgentBanner(
  notifications: ProcurementNotifications,
  role: AppRole,
): string | null {
  if (notifications.urgentCount <= 0 && notifications.submittedPending <= 0) {
    return null;
  }

  if (isAdminRole(role) && notifications.urgentCount > 0) {
    return notifications.urgentCount === 1
      ? "1 batch ready for final approval — set price if needed, then approve."
      : `${notifications.urgentCount.toLocaleString()} batches ready for final approval — set price if needed, then approve.`;
  }

  if (
    (role === "cash_manager" || role === "logistics_manager") &&
    notifications.urgentCount > 0
  ) {
    return notifications.urgentCount === 1
      ? "1 batch needs your confirmation — verify goods match the warehouse record."
      : `${notifications.urgentCount.toLocaleString()} batches need your confirmation — verify goods match the warehouse record.`;
  }

  if (role === "warehouse_manager" && notifications.submittedPending > 0) {
    return notifications.submittedPending === 1
      ? "1 batch you recorded is waiting for a second person to confirm receipt."
      : `${notifications.submittedPending.toLocaleString()} batches you recorded are waiting for a second person to confirm receipt.`;
  }

  return null;
}

export function formatProcurementAwarenessBanner(
  notifications: ProcurementNotifications,
  role: AppRole,
): string | null {
  if (isAdminRole(role)) {
    const parts: string[] = [];
    if (notifications.awarenessCount > 0) {
      parts.push(
        notifications.awarenessCount === 1
          ? "1 batch is awaiting warehouse confirmation before your final approval"
          : `${notifications.awarenessCount.toLocaleString()} batches are awaiting warehouse confirmation before your final approval`,
      );
    }
    if (notifications.needsPrice > 0) {
      parts.push(
        notifications.needsPrice === 1
          ? "1 batch at final step still needs a unit price"
          : `${notifications.needsPrice.toLocaleString()} batches at final step still need a unit price`,
      );
    }
    return parts.length > 0 ? `${parts.join(". ")}.` : null;
  }

  if (
    (role === "warehouse_manager" ||
      role === "cash_manager" ||
      role === "logistics_manager") &&
    notifications.awarenessCount > 0
  ) {
    return notifications.awarenessCount === 1
      ? "1 batch you confirmed is with admin for final approval."
      : `${notifications.awarenessCount.toLocaleString()} batches you are involved in are with admin for final approval.`;
  }

  return null;
}

export function formatProcurementSubmittedPendingBanner(
  count: number,
  role: AppRole,
): string | null {
  return null;
}

export function canReceiveProcurementNotifications(role: AppRole): boolean {
  return (
    isAdminRole(role) ||
    role === "warehouse_manager" ||
    role === "cash_manager" ||
    role === "logistics_manager"
  );
}
