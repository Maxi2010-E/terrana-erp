import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth/get-session";
import {
  canAccessModule,
  canApproveExpenses,
  canApprovePayment,
  canManageSuppliers,
  canRecordPayment,
  canTopUpPettyCash,
  canWriteExpenses,
  canWriteInventory,
  canWriteLogistics,
  canWriteProcessing,
  canWriteProcurement,
  canWriteWaste,
  isAdminRole,
} from "@/lib/permissions/matrix";
import type { AppModule } from "@/lib/permissions/matrix";
import { normalizeAppRole, type AppRole } from "@/lib/roles";
import { hasRole } from "@/lib/roles";

export async function requireAuth() {
  const session = await getSessionUser();

  if (!session.authUser) {
    redirect("/login");
  }

  const role = normalizeAppRole(session.appUser?.role);

  return {
    ...session,
    role,
    appUser: session.appUser
      ? { ...session.appUser, role }
      : null,
  };
}

export async function requireRole(allowed: AppRole[]) {
  const session = await requireAuth();
  const role = session.role;

  if (!hasRole(role, allowed)) {
    redirect("/dashboard");
  }

  return { ...session, role };
}

async function requireModule(module: AppModule) {
  const session = await requireAuth();
  if (!canAccessModule(session.role, module)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireHrAdmin() {
  return requireRole(["super_admin", "admin"]);
}

export async function requireSuperAdmin() {
  return requireRole(["super_admin"]);
}

export async function requireSupplierRead() {
  return requireModule("suppliers");
}

export async function requireSupplierAdmin() {
  const session = await requireAuth();
  if (!canManageSuppliers(session.role)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireProcurementRead() {
  return requireModule("procurement");
}

export async function requireProcurementWrite() {
  const session = await requireAuth();
  if (!canWriteProcurement(session.role)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireProcurementApprove() {
  return requireRole([
    "super_admin",
    "admin",
    "cash_manager",
    "logistics_manager",
  ]);
}

export async function requireProcessingRead() {
  return requireModule("processing");
}

export async function requireProcessingWrite() {
  const session = await requireAuth();
  if (!canWriteProcessing(session.role)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireProcessingApprove() {
  return requireRole([
    "super_admin",
    "admin",
    "warehouse_manager",
    "logistics_manager",
  ]);
}

export async function requireWasteRead() {
  return requireModule("waste");
}

export async function requireWasteWrite() {
  const session = await requireAuth();
  if (!canWriteWaste(session.role)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireInventoryRead() {
  return requireModule("inventory");
}

export async function requireInventoryWrite() {
  const session = await requireAuth();
  if (!canWriteInventory(session.role)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requirePaymentRead() {
  return requireModule("payments");
}

export async function requirePaymentWrite() {
  const session = await requireAuth();
  if (!canRecordPayment(session.role)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requirePaymentApprove() {
  const session = await requireAuth();
  if (!canApprovePayment(session.role)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireExpenseRead() {
  return requireModule("expenses");
}

export async function requireExpenseWrite() {
  const session = await requireAuth();
  if (!canWriteExpenses(session.role)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireExpenseApprove() {
  const session = await requireAuth();
  if (!canApproveExpenses(session.role)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireExpensePaidNow() {
  return requireRole(["cash_manager"]);
}

export async function requirePettyCashTopUp() {
  const session = await requireAuth();
  if (!canTopUpPettyCash(session.role)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireLogisticsRead() {
  return requireModule("logistics");
}

export async function requireLogisticsWrite() {
  const session = await requireAuth();
  if (!canWriteLogistics(session.role)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireReportsRead() {
  return requireModule("reports");
}

export async function requirePayrollRead() {
  return requireHrAdmin();
}

export async function requirePayrollWrite() {
  return requireHrAdmin();
}

export async function requireProcessingReadLegacy() {
  return requireProcessingRead();
}

export { isAdminRole };
