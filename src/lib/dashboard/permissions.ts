import type { DashboardKpiKey } from "@/lib/dashboard/types";
import { canViewPrices, isAdminRole } from "@/lib/permissions/matrix";
import type { AppRole } from "@/lib/roles";

const ALL_KPI_KEYS: DashboardKpiKey[] = [
  "procurementKg",
  "currentInventoryKg",
  "totalSuppliers",
  "outstandingPayments",
  "containersInTransit",
  "monthlyExpenses",
  "monthlyProcurementValue",
  "monthlyShipments",
];

const WAREHOUSE_KPIS: DashboardKpiKey[] = ["currentInventoryKg", "procurementKg"];

const CASH_KPIS: DashboardKpiKey[] = [
  "monthlyExpenses",
  "outstandingPayments",
];

const LOGISTICS_KPIS: DashboardKpiKey[] = [
  "containersInTransit",
  "monthlyShipments",
];

export function canAccessReports(role: AppRole): boolean {
  return isAdminRole(role);
}

export function getDashboardKpiKeysForRole(role: AppRole): DashboardKpiKey[] {
  if (isAdminRole(role)) {
    return ALL_KPI_KEYS;
  }
  if (role === "warehouse_manager") {
    return WAREHOUSE_KPIS;
  }
  if (role === "cash_manager") {
    return CASH_KPIS;
  }
  if (role === "logistics_manager") {
    return LOGISTICS_KPIS;
  }
  return [];
}

export function canSeeFinancialTrends(role: AppRole): boolean {
  return canViewPrices(role) || role === "cash_manager";
}

export function canSeeLogisticsTrends(role: AppRole): boolean {
  return (
    isAdminRole(role) || role === "logistics_manager"
  );
}

export function canSeeInventoryTrends(role: AppRole): boolean {
  return (
    isAdminRole(role) ||
    role === "warehouse_manager" ||
    role === "cash_manager"
  );
}
