import type { AppRole } from "@/lib/roles";
import {
  type DualNotificationCounts,
  hasDualNotifications,
} from "@/lib/notifications/dual-badges";
import {
  canAccessProcessing,
  canApproveProcessingSession,
} from "@/lib/processing/permissions";

export type ProcessingQueueNotifications = {
  batchesWaiting: number;
  bagsRemaining: number;
  pendingApproval: number;
  submittedPending: number;
};

export const EMPTY_PROCESSING_QUEUE_NOTIFICATIONS: ProcessingQueueNotifications =
  {
    batchesWaiting: 0,
    bagsRemaining: 0,
    pendingApproval: 0,
    submittedPending: 0,
  };

export function processingSidebarBadges(
  notifications: ProcessingQueueNotifications,
  role: AppRole,
): DualNotificationCounts {
  if (canApproveProcessingSession(role)) {
    return {
      urgent: notifications.pendingApproval,
      pending: notifications.batchesWaiting,
    };
  }

  let pending = notifications.submittedPending;

  if (role === "warehouse_manager") {
    pending += notifications.batchesWaiting;
  }

  return {
    urgent: 0,
    pending,
  };
}

export function hasProcessingSidebarAlert(
  notifications: ProcessingQueueNotifications,
  role: AppRole,
): boolean {
  return hasDualNotifications(processingSidebarBadges(notifications, role));
}

export function formatProcessingSidebarTitle(
  notifications: ProcessingQueueNotifications,
  role: AppRole,
): string {
  const badges = processingSidebarBadges(notifications, role);
  const parts: string[] = [];

  if (badges.urgent > 0) {
    parts.push(
      badges.urgent === 1
        ? "1 session needs your approval"
        : `${badges.urgent.toLocaleString()} sessions need your approval`,
    );
  }

  if (badges.pending > 0) {
    if (canApproveProcessingSession(role)) {
      const batchLabel =
        badges.pending === 1
          ? "1 batch in processing queue"
          : `${badges.pending.toLocaleString()} batches in processing queue`;

      if (notifications.bagsRemaining > 0) {
        parts.push(
          `${batchLabel} · ${notifications.bagsRemaining.toLocaleString()} bags remaining`,
        );
      } else {
        parts.push(batchLabel);
      }
    } else if (notifications.submittedPending > 0) {
      parts.push(
        notifications.submittedPending === 1
          ? "1 request waiting for admin approval"
          : `${notifications.submittedPending.toLocaleString()} requests waiting for admin approval`,
      );

      if (
        role === "warehouse_manager" &&
        notifications.batchesWaiting > 0 &&
        notifications.submittedPending !== badges.pending
      ) {
        parts.push(
          notifications.batchesWaiting === 1
            ? "1 batch in processing queue"
            : `${notifications.batchesWaiting.toLocaleString()} batches in processing queue`,
        );
      }
    } else {
      parts.push(
        badges.pending === 1
          ? "1 batch in processing queue"
          : `${badges.pending.toLocaleString()} batches in processing queue`,
      );
    }
  }

  return parts.join(" · ");
}

export function formatProcessingSubmittedPendingBanner(
  count: number,
): string | null {
  if (count <= 0) {
    return null;
  }

  return count === 1
    ? "You have 1 processing request waiting for admin approval."
    : `You have ${count.toLocaleString()} processing requests waiting for admin approval.`;
}

export function formatProcessingUrgentBanner(count: number): string | null {
  if (count <= 0) {
    return null;
  }

  return count === 1
    ? "1 processing request is awaiting your approval — work cannot start until you approve."
    : `${count.toLocaleString()} processing requests are awaiting your approval — work cannot start until you approve them.`;
}

export function canReceiveProcessingQueueNotifications(role: AppRole): boolean {
  return canAccessProcessing(role);
}
