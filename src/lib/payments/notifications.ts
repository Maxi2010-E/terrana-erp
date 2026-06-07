import type { AppRole } from "@/lib/roles";
import {
  type DualNotificationCounts,
  hasDualNotifications,
} from "@/lib/notifications/dual-badges";

export type PaymentNotifications = {
  /** All payments awaiting admin approval (admin view). */
  pendingApproval: number;
  /** Payments the current user recorded that are still pending (accounts view). */
  submittedPending: number;
  /** Approved procurement batches with unpaid or partial balance. */
  outstandingBatches: number;
};

export const EMPTY_PAYMENT_NOTIFICATIONS: PaymentNotifications = {
  pendingApproval: 0,
  submittedPending: 0,
  outstandingBatches: 0,
};

export function paymentSidebarBadges(
  notifications: PaymentNotifications,
  role: AppRole,
): DualNotificationCounts {
  if (role === "super_admin" || role === "admin") {
    return {
      urgent: notifications.pendingApproval,
      pending: notifications.outstandingBatches,
    };
  }

  return {
    urgent: notifications.submittedPending,
    pending:
      notifications.submittedPending > 0
        ? 0
        : notifications.outstandingBatches,
  };
}

export function hasPaymentSidebarAlert(
  notifications: PaymentNotifications,
  role: AppRole,
): boolean {
  return hasDualNotifications(paymentSidebarBadges(notifications, role));
}

export function formatPaymentNotificationTitle(
  notifications: PaymentNotifications,
  role: AppRole,
): string {
  const badges = paymentSidebarBadges(notifications, role);
  const parts: string[] = [];

  if (badges.urgent > 0) {
    parts.push(
      badges.urgent === 1
        ? "1 payment awaiting approval"
        : `${badges.urgent.toLocaleString()} payments awaiting approval`,
    );
  }

  if (badges.pending > 0) {
    if (role === "super_admin" || role === "admin") {
      parts.push(
        badges.pending === 1
          ? "1 batch with outstanding balance"
          : `${badges.pending.toLocaleString()} batches with outstanding balance`,
      );
    } else if (notifications.submittedPending > 0) {
      parts.push(
        badges.pending === 1
          ? "1 payment waiting for admin approval"
          : `${badges.pending.toLocaleString()} payments waiting for admin approval`,
      );
    } else {
      parts.push(
        badges.pending === 1
          ? "1 batch awaiting payment"
          : `${badges.pending.toLocaleString()} batches awaiting payment`,
      );
    }
  }

  return parts.join(" · ");
}

export function formatPaymentUrgentBanner(
  notifications: PaymentNotifications,
): string | null {
  if (notifications.pendingApproval === 0) {
    return null;
  }

  return notifications.pendingApproval === 1
    ? "1 payment is awaiting your approval — supplier balance will not update until you approve."
    : `${notifications.pendingApproval.toLocaleString()} payments are awaiting your approval — supplier balances will not update until you approve them.`;
}

export function formatPaymentOutstandingBanner(
  notifications: PaymentNotifications,
): string | null {
  if (notifications.outstandingBatches === 0) {
    return null;
  }

  return notifications.outstandingBatches === 1
    ? "1 approved batch still has an outstanding supplier balance."
    : `${notifications.outstandingBatches.toLocaleString()} approved batches still have outstanding supplier balances.`;
}

export function formatPaymentSubmittedPendingBanner(
  count: number,
): string | null {
  if (count <= 0) {
    return null;
  }

  return count === 1
    ? "You have 1 payment waiting for admin approval."
    : `You have ${count.toLocaleString()} payments waiting for admin approval.`;
}

/** Top-of-page urgent banner for accounts (parallel to admin urgent banner). */
export function formatPaymentSubmittedPendingUrgentBanner(
  count: number,
): string | null {
  if (count <= 0) {
    return null;
  }

  return count === 1
    ? "1 payment you recorded is awaiting admin approval — supplier balance will not update until an admin approves."
    : `${count.toLocaleString()} payments you recorded are awaiting admin approval — supplier balances will not update until an admin approves.`;
}

/** Red dashboard strip below summary cards (same layout/copy for admin and accounts). */
export function formatPaymentPendingDashboardStripTitle(count: number): string {
  return count === 1
    ? "1 payment awaiting admin approval"
    : `${count.toLocaleString()} payments awaiting admin approval`;
}

export function formatPaymentPendingDashboardStripSubtitle(): string {
  return "Review pending records to update batch balances.";
}

export function canReceivePaymentNotifications(role: AppRole): boolean {
  return role === "super_admin" || role === "admin" || role === "cash_manager";
}
