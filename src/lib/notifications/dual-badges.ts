export type DualNotificationCounts = {
  urgent: number;
  pending: number;
  /** Approved and waiting for staff to mark payment made (green). */
  ready?: number;
};

export const EMPTY_DUAL_NOTIFICATION_COUNTS: DualNotificationCounts = {
  urgent: 0,
  pending: 0,
  ready: 0,
};

export function hasDualNotifications(counts: DualNotificationCounts): boolean {
  return counts.urgent > 0 || counts.pending > 0 || (counts.ready ?? 0) > 0;
}

export function formatNotificationCount(count: number): string | null {
  if (count <= 0) {
    return null;
  }

  return count > 99 ? "99+" : String(count);
}
