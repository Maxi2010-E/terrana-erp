import type { AppRole } from "@/lib/roles";

export function canAccessProcessing(role: AppRole): boolean {
  return (
    role === "super_admin" ||
    role === "admin" ||
    role === "accounts" ||
    role === "inventory_manager"
  );
}

export function canUnlockProcessingSession(role: AppRole): boolean {
  return role === "super_admin";
}

export function canApproveProcessingSession(role: AppRole): boolean {
  return role === "super_admin" || role === "admin";
}
