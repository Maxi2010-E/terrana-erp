import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth/get-session";
import type { AppRole } from "@/lib/roles";
import { hasRole } from "@/lib/roles";

export async function requireAuth() {
  const session = await getSessionUser();

  if (!session.authUser) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(allowed: AppRole[]) {
  const session = await requireAuth();
  const role = (session.appUser?.role ?? "accounts") as AppRole;

  if (!hasRole(role, allowed)) {
    redirect("/dashboard");
  }

  return { ...session, role };
}

export async function requireHrAdmin() {
  return requireRole(["super_admin", "admin"]);
}

export async function requireSuperAdmin() {
  return requireRole(["super_admin"]);
}

export async function requireSupplierRead() {
  return requireRole(["super_admin", "admin", "accounts"]);
}

export async function requireSupplierAdmin() {
  return requireRole(["super_admin", "admin"]);
}

export async function requireProcurementRead() {
  return requireRole(["super_admin", "admin", "accounts"]);
}

export async function requireProcurementWrite() {
  return requireRole(["super_admin", "admin", "accounts"]);
}

export async function requireProcurementApprove() {
  return requireRole(["super_admin", "admin"]);
}

export async function requireProcessingRead() {
  return requireRole(["super_admin", "admin", "accounts", "inventory_manager"]);
}

export async function requireProcessingWrite() {
  return requireRole(["super_admin", "admin", "accounts", "inventory_manager"]);
}

export async function requireProcessingApprove() {
  return requireRole(["super_admin", "admin"]);
}

export async function requireInventoryRead() {
  return requireRole(["super_admin", "admin", "inventory_manager"]);
}

export async function requireInventoryWrite() {
  return requireRole(["super_admin", "admin", "inventory_manager"]);
}
