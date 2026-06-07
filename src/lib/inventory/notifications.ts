import type { AppRole } from "@/lib/roles";
import {
  type DualNotificationCounts,
  hasDualNotifications,
} from "@/lib/notifications/dual-badges";

export type PreStockNotifications = {
  /** Pre-stock lines still in the waiting room (status available, bags & kg on hand). */
  availableLots: number;
  availableBags: number;
  availableKg: number;
};

export const EMPTY_PRE_STOCK_NOTIFICATIONS: PreStockNotifications = {
  availableLots: 0,
  availableBags: 0,
  availableKg: 0,
};

export function canReceivePreStockNotifications(role: AppRole): boolean {
  return role === "super_admin" || role === "admin" || role === "warehouse_manager";
}

export function preStockSidebarBadges(
  notifications: PreStockNotifications,
): DualNotificationCounts {
  return {
    urgent: 0,
    pending: notifications.availableLots,
  };
}

export function hasPreStockSidebarAlert(
  notifications: PreStockNotifications,
): boolean {
  return hasDualNotifications(preStockSidebarBadges(notifications));
}

export function formatPreStockSidebarTitle(
  notifications: PreStockNotifications,
): string {
  const { availableLots, availableBags, availableKg } = notifications;

  if (availableLots <= 0) {
    return "";
  }

  const lotsLabel =
    availableLots === 1
      ? "1 pre-stock line awaiting grading"
      : `${availableLots.toLocaleString()} pre-stock lines awaiting grading`;

  const bagsLabel = `${availableBags.toLocaleString()} bag${availableBags === 1 ? "" : "s"}`;
  const kgLabel = `${availableKg.toLocaleString(undefined, {
    maximumFractionDigits: 3,
  })} kg`;

  return `${lotsLabel} · ${bagsLabel} · ${kgLabel} in pre-stock`;
}

export function formatPreStockAwarenessBanner(
  notifications: PreStockNotifications,
): string | null {
  if (notifications.availableLots <= 0) {
    return null;
  }

  const lotsLabel =
    notifications.availableLots === 1
      ? "1 pre-stock line"
      : `${notifications.availableLots.toLocaleString()} pre-stock lines`;

  const bagsLabel = `${notifications.availableBags.toLocaleString()} bag${
    notifications.availableBags === 1 ? "" : "s"
  }`;
  const kgLabel = `${notifications.availableKg.toLocaleString(undefined, {
    maximumFractionDigits: 3,
  })} kg`;

  return `${lotsLabel} still in pre-stock (${bagsLabel}, ${kgLabel} on hand). Grade into export inventory when ready — this alert clears when everything is allocated.`;
}

/** Export batches graded but not yet assigned to a physical warehouse lot. */
export type ExportLotAssignmentNotifications = {
  unassignedBatches: number;
  unassignedBags: number;
  unassignedKg: number;
};

export const EMPTY_EXPORT_LOT_ASSIGNMENT_NOTIFICATIONS: ExportLotAssignmentNotifications =
  {
    unassignedBatches: 0,
    unassignedBags: 0,
    unassignedKg: 0,
  };

export function exportLotAssignmentSidebarBadges(
  notifications: ExportLotAssignmentNotifications,
): DualNotificationCounts {
  return {
    urgent: 0,
    pending: notifications.unassignedBatches,
  };
}

export function hasExportLotAssignmentSidebarAlert(
  notifications: ExportLotAssignmentNotifications,
): boolean {
  return hasDualNotifications(exportLotAssignmentSidebarBadges(notifications));
}

export function formatExportLotAssignmentSidebarTitle(
  notifications: ExportLotAssignmentNotifications,
): string {
  const { unassignedBatches, unassignedBags, unassignedKg } = notifications;

  if (unassignedBatches <= 0) {
    return "";
  }

  const batchesLabel =
    unassignedBatches === 1
      ? "1 export batch needs a warehouse lot"
      : `${unassignedBatches.toLocaleString()} export batches need warehouse lots`;

  const bagsLabel = `${unassignedBags.toLocaleString()} bag${
    unassignedBags === 1 ? "" : "s"
  }`;
  const kgLabel = `${unassignedKg.toLocaleString(undefined, {
    maximumFractionDigits: 3,
  })} kg`;

  return `${batchesLabel} · ${bagsLabel} · ${kgLabel} unassigned`;
}

export function formatExportLotAssignmentBanner(
  notifications: ExportLotAssignmentNotifications,
): string | null {
  if (notifications.unassignedBatches <= 0) {
    return null;
  }

  const batchesLabel =
    notifications.unassignedBatches === 1
      ? "1 export inventory batch"
      : `${notifications.unassignedBatches.toLocaleString()} export inventory batches`;

  const bagsLabel = `${notifications.unassignedBags.toLocaleString()} bag${
    notifications.unassignedBags === 1 ? "" : "s"
  }`;
  const kgLabel = `${notifications.unassignedKg.toLocaleString(undefined, {
    maximumFractionDigits: 3,
  })} kg`;

  return `${batchesLabel} must be assigned to a warehouse lot before containers can load (${bagsLabel}, ${kgLabel}). Use the Warehouse lot column on the Export inventory tab — this alert clears only when every available batch has a lot.`;
}

export function inventoryHubSidebarBadges(
  preStock: PreStockNotifications,
  exportLots: ExportLotAssignmentNotifications,
): DualNotificationCounts {
  const preStockBadges = preStockSidebarBadges(preStock);
  const exportBadges = exportLotAssignmentSidebarBadges(exportLots);

  return {
    urgent: preStockBadges.urgent + exportBadges.urgent,
    pending: preStockBadges.pending + exportBadges.pending,
    ready: (preStockBadges.ready ?? 0) + (exportBadges.ready ?? 0),
  };
}

export function hasInventoryHubSidebarAlert(
  preStock: PreStockNotifications,
  exportLots: ExportLotAssignmentNotifications,
): boolean {
  return hasDualNotifications(inventoryHubSidebarBadges(preStock, exportLots));
}

export function formatInventoryHubSidebarTitle(
  preStock: PreStockNotifications,
  exportLots: ExportLotAssignmentNotifications,
): string {
  const parts: string[] = [];

  const preStockTitle = formatPreStockSidebarTitle(preStock);
  if (preStockTitle) {
    parts.push(preStockTitle);
  }

  const exportTitle = formatExportLotAssignmentSidebarTitle(exportLots);
  if (exportTitle) {
    parts.push(exportTitle);
  }

  return parts.join(" · ");
}
