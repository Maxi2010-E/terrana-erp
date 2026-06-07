import type { NotificationUrgency } from "@/lib/notifications/urgency";
import { isAdminRole } from "@/lib/permissions/matrix";
import type { ProcurementStatus } from "@/lib/procurement/constants";
import type { AppRole } from "@/lib/roles";

/** Viewer-relative urgency for a procurement status badge or row highlight. */
export function procurementStatusUrgencyForViewer(
  status: ProcurementStatus,
  role: AppRole,
): NotificationUrgency | null {
  if (status === "approved" || status === "rejected") {
    return null;
  }

  if (
    status === "pending_approval" ||
    status === "pending_second_approval"
  ) {
    if (isAdminRole(role)) {
      return "awareness";
    }
    if (role === "warehouse_manager") {
      return "urgent";
    }
    if (role === "cash_manager" || role === "logistics_manager") {
      return "urgent";
    }
    return null;
  }

  if (status === "pending_admin_approval") {
    if (isAdminRole(role)) {
      return "urgent";
    }
    return "awareness";
  }

  return null;
}
