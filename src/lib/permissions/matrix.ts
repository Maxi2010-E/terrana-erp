import type { AppRole } from "@/lib/roles";

export type AppModule =
  | "dashboard"
  | "office"
  | "hr"
  | "users"
  | "suppliers"
  | "procurement"
  | "processing"
  | "waste"
  | "inventory"
  | "payments"
  | "expenses"
  | "logistics"
  | "reports"
  | "settings";

export type ApprovalStep = "first" | "second" | "final";

const ADMIN_ROLES: AppRole[] = ["super_admin", "admin"];
const WAREHOUSE_ROLES: AppRole[] = ["warehouse_manager"];
const CASH_ROLES: AppRole[] = ["cash_manager"];
const LOGISTICS_ROLES: AppRole[] = ["logistics_manager"];

export function isAdminRole(role: AppRole): boolean {
  return role === "super_admin" || role === "admin";
}

export function canViewPrices(role: AppRole): boolean {
  return isAdminRole(role);
}

export function canAccessModule(role: AppRole, module: AppModule): boolean {
  if (role === "super_admin") {
    return true;
  }

  switch (module) {
    case "dashboard":
    case "office":
      return true;
    case "hr":
    case "users":
    case "reports":
    case "settings":
      return role === "admin";
    case "suppliers":
      return role === "admin" || role === "logistics_manager";
    case "procurement":
      return (
        role === "admin" ||
        role === "warehouse_manager" ||
        role === "cash_manager" ||
        role === "logistics_manager"
      );
    case "processing":
      return (
        role === "admin" ||
        role === "warehouse_manager" ||
        role === "cash_manager" ||
        role === "logistics_manager"
      );
    case "waste":
      return role === "admin" || role === "warehouse_manager" || role === "logistics_manager";
    case "inventory":
      return (
        role === "admin" ||
        role === "warehouse_manager" ||
        role === "cash_manager" ||
        role === "logistics_manager"
      );
    case "payments":
      return role === "admin" || role === "cash_manager";
    case "expenses":
      return (
        role === "admin" || role === "warehouse_manager" || role === "cash_manager"
      );
    case "logistics":
      return role === "admin" || role === "logistics_manager";
    default:
      return false;
  }
}

export function canWriteProcurement(role: AppRole): boolean {
  return (
    role === "super_admin" || role === "admin" || role === "warehouse_manager"
  );
}

export function canWriteProcessing(role: AppRole): boolean {
  return (
    role === "super_admin" || role === "admin" || role === "warehouse_manager"
  );
}

export function canWriteWaste(role: AppRole): boolean {
  return canWriteProcessing(role);
}

export function canWriteInventory(role: AppRole): boolean {
  return (
    role === "super_admin" || role === "admin" || role === "warehouse_manager"
  );
}

export function canWriteExpenses(role: AppRole): boolean {
  return (
    role === "super_admin" ||
    role === "admin" ||
    role === "warehouse_manager" ||
    role === "cash_manager"
  );
}

export function canApproveExpenses(role: AppRole): boolean {
  return isAdminRole(role);
}

export function canTopUpPettyCash(role: AppRole): boolean {
  return isAdminRole(role) || role === "cash_manager";
}

export function canMarkExpensePaid(role: AppRole): boolean {
  return role === "cash_manager";
}

export function canRecordPayment(role: AppRole): boolean {
  return isAdminRole(role);
}

export function canApprovePayment(role: AppRole): boolean {
  return isAdminRole(role);
}

export function canWriteLogistics(role: AppRole): boolean {
  return (
    role === "super_admin" || role === "admin" || role === "logistics_manager"
  );
}

export function canManageSuppliers(role: AppRole): boolean {
  return isAdminRole(role);
}

export function canApproveProcurementStep(
  role: AppRole,
  step: ApprovalStep,
): boolean {
  if (role === "super_admin" || role === "admin") {
    return step === "final";
  }
  if (step === "first") {
    return role === "cash_manager" || role === "logistics_manager";
  }
  if (step === "second") {
    return role === "cash_manager" || role === "logistics_manager";
  }
  return false;
}

export function canApproveProcessingStep(
  role: AppRole,
  step: ApprovalStep,
): boolean {
  if (role === "super_admin" || role === "admin") {
    return step === "final";
  }
  if (step === "first") {
    return role === "warehouse_manager";
  }
  if (step === "second") {
    return role === "logistics_manager";
  }
  return false;
}

export function canParticipateInProcurementApproval(role: AppRole): boolean {
  return (
    canApproveProcurementStep(role, "first") ||
    canApproveProcurementStep(role, "second") ||
    canApproveProcurementStep(role, "final")
  );
}

export function canParticipateInProcessingApproval(role: AppRole): boolean {
  return (
    canApproveProcessingStep(role, "first") ||
    canApproveProcessingStep(role, "second") ||
    canApproveProcessingStep(role, "final")
  );
}

export function canRejectAtApprovalStep(role: AppRole): boolean {
  return (
    isAdminRole(role) ||
    role === "warehouse_manager" ||
    role === "cash_manager" ||
    role === "logistics_manager"
  );
}

export function assignableRoles(actorRole: AppRole): AppRole[] {
  if (actorRole === "super_admin") {
    return ["admin", "warehouse_manager", "cash_manager", "logistics_manager"];
  }
  if (actorRole === "admin") {
    return ["warehouse_manager", "cash_manager", "logistics_manager"];
  }
  return [];
}

export const ROLE_MODULE_SUMMARY = {
  admin: ADMIN_ROLES,
  warehouse: WAREHOUSE_ROLES,
  cash: CASH_ROLES,
  logistics: LOGISTICS_ROLES,
} as const;
