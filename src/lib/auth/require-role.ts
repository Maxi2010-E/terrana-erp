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
