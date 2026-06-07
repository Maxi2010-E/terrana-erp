import type { AppRole } from "@/lib/roles";
import { hasRole } from "@/lib/roles";

const OFFICE_ADMIN_ROLES: AppRole[] = ["super_admin", "admin"];

export function canViewAttendanceRoster(role: AppRole): boolean {
  return hasRole(role, OFFICE_ADMIN_ROLES);
}

export function canManageOfficeTasks(role: AppRole): boolean {
  return hasRole(role, OFFICE_ADMIN_ROLES);
}

export function canDeleteGeneralBoardMessage(role: AppRole): boolean {
  return hasRole(role, OFFICE_ADMIN_ROLES);
}

export function canManageFacilityGeofence(role: AppRole): boolean {
  return hasRole(role, OFFICE_ADMIN_ROLES);
}
