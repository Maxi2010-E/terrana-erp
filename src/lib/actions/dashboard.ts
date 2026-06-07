"use server";

import { getPaymentNotifications } from "@/lib/actions/payments";
import { createMemoryTtlCache } from "@/lib/cache/memory-ttl-cache";
import {
  DASHBOARD_CACHE_SECONDS,
  DASHBOARD_RECENT_LIMIT,
  DASHBOARD_TREND_MONTHS,
} from "@/lib/dashboard/constants";
import {
  canSeeFinancialTrends,
  canSeeInventoryTrends,
  canSeeLogisticsTrends,
  getDashboardKpiKeysForRole,
} from "@/lib/dashboard/permissions";
import { normalizeAppRole } from "@/lib/roles";
import type {
  DashboardKpi,
  DashboardKpiKey,
  DashboardOverview,
  DashboardRecentActivity,
  DashboardTrends,
  TrendPoint,
} from "@/lib/dashboard/types";
import { getSessionUser } from "@/lib/auth/get-session";
import { canReceivePaymentNotifications } from "@/lib/payments/notifications";
import type { AppRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

const dashboardOverviewCache = createMemoryTtlCache<DashboardOverview>(
  DASHBOARD_CACHE_SECONDS * 1000,
);
const dashboardTrendsCache = createMemoryTtlCache<DashboardTrends>(
  DASHBOARD_CACHE_SECONDS * 1000,
);

function joinOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function readRpcNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    return Number.parseFloat(value) || 0;
  }
  return 0;
}

type DashboardKpiMetricsRpc = {
  procurement_kg: number;
  inventory_kg: number;
  active_suppliers: number;
  containers_in_transit: number;
  monthly_expenses: number;
  monthly_procurement_value: number;
  monthly_shipments: number;
};

async function fetchDashboardKpiMetrics(
  supabase: Awaited<ReturnType<typeof createClient>>,
  monthRange: { start: string; end: string },
): Promise<DashboardKpiMetricsRpc> {
  const { data, error } = await supabase.rpc("get_dashboard_kpi_metrics", {
    month_start: monthRange.start,
    month_end: monthRange.end,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = data as Record<string, unknown>;
  return {
    procurement_kg: readRpcNumber(row.procurement_kg),
    inventory_kg: readRpcNumber(row.inventory_kg),
    active_suppliers: readRpcNumber(row.active_suppliers),
    containers_in_transit: readRpcNumber(row.containers_in_transit),
    monthly_expenses: readRpcNumber(row.monthly_expenses),
    monthly_procurement_value: readRpcNumber(row.monthly_procurement_value),
    monthly_shipments: readRpcNumber(row.monthly_shipments),
  };
}

function monthKeysForTrend(count: number): string[] {
  const keys: string[] = [];
  const cursor = new Date();
  cursor.setDate(1);

  for (let index = 0; index < count; index += 1) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, "0");
    keys.unshift(`${year}-${month}`);
    cursor.setMonth(cursor.getMonth() - 1);
  }

  return keys;
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number.parseInt(year, 10), Number.parseInt(month, 10) - 1, 1);
  return date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

function buildTrend(
  rows: { date: string; value: number }[],
  monthKeys: string[],
): TrendPoint[] {
  const buckets = new Map(monthKeys.map((key) => [key, 0]));

  for (const row of rows) {
    const key = row.date.slice(0, 7);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + row.value);
    }
  }

  return monthKeys.map((monthKey) => ({
    monthKey,
    label: formatMonthLabel(monthKey),
    value: buckets.get(monthKey) ?? 0,
  }));
}

function currentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function trendStartDate(monthCount: number): string {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - (monthCount - 1));
  return date.toISOString().slice(0, 10);
}

async function loadMetricValues(
  supabase: Awaited<ReturnType<typeof createClient>>,
  role: AppRole,
): Promise<Partial<Record<DashboardKpiKey, { value: number; note: string }>>> {
  const keys = getDashboardKpiKeysForRole(role);
  const metrics: Partial<Record<DashboardKpiKey, { value: number; note: string }>> =
    {};
  const monthRange = currentMonthRange();
  const rpcKeys = keys.filter((key) => key !== "outstandingPayments");

  const [rpcMetrics, paymentNotifications] = await Promise.all([
    rpcKeys.length > 0
      ? fetchDashboardKpiMetrics(supabase, monthRange)
      : Promise.resolve(null),
    keys.includes("outstandingPayments") && canReceivePaymentNotifications(role)
      ? getPaymentNotifications()
      : Promise.resolve(null),
  ]);

  if (rpcMetrics) {
    if (keys.includes("procurementKg")) {
      metrics.procurementKg = {
        value: rpcMetrics.procurement_kg,
        note: "Approved procurement batches (all time)",
      };
    }
    if (keys.includes("currentInventoryKg")) {
      metrics.currentInventoryKg = {
        value: rpcMetrics.inventory_kg,
        note: "Available export inventory",
      };
    }
    if (keys.includes("totalSuppliers")) {
      metrics.totalSuppliers = {
        value: rpcMetrics.active_suppliers,
        note: "Active supplier records",
      };
    }
    if (keys.includes("containersInTransit")) {
      metrics.containersInTransit = {
        value: rpcMetrics.containers_in_transit,
        note: "Shipments currently in transit",
      };
    }
    if (keys.includes("monthlyExpenses")) {
      metrics.monthlyExpenses = {
        value: rpcMetrics.monthly_expenses,
        note: "Approved daily + operational expenses this month",
      };
    }
    if (keys.includes("monthlyProcurementValue")) {
      metrics.monthlyProcurementValue = {
        value: rpcMetrics.monthly_procurement_value,
        note: "Approved procurement value this month",
      };
    }
    if (keys.includes("monthlyShipments")) {
      metrics.monthlyShipments = {
        value: rpcMetrics.monthly_shipments,
        note: "Shipments loaded this month",
      };
    }
  }

  if (paymentNotifications) {
    metrics.outstandingPayments = {
      value: paymentNotifications.outstandingBatches,
      note:
        paymentNotifications.pendingApproval > 0 &&
        (role === "super_admin" || role === "admin")
          ? `${paymentNotifications.pendingApproval.toLocaleString()} payment(s) awaiting approval`
          : "Approved batches with balance due",
    };
  }

  return metrics;
}

function formatKpiValue(key: DashboardKpiKey, value: number): string {
  if (key === "totalSuppliers" || key === "outstandingPayments") {
    return value.toLocaleString();
  }
  if (
    key === "containersInTransit" ||
    key === "monthlyShipments"
  ) {
    return value.toLocaleString();
  }
  if (key === "monthlyExpenses" || key === "monthlyProcurementValue") {
    return `₦${value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} kg`;
}

const KPI_META: Record<
  DashboardKpiKey,
  { title: string; accent: string; href?: string }
> = {
  procurementKg: {
    title: "Procurement KG",
    accent: "border-l-chart-1",
    href: "/procurement",
  },
  currentInventoryKg: {
    title: "Current Inventory",
    accent: "border-l-chart-2",
    href: "/inventory?tab=export",
  },
  totalSuppliers: {
    title: "Total Suppliers",
    accent: "border-l-chart-5",
    href: "/suppliers",
  },
  outstandingPayments: {
    title: "Outstanding Payments",
    accent: "border-l-chart-3",
    href: "/payments",
  },
  containersInTransit: {
    title: "Containers In Transit",
    accent: "border-l-chart-4",
    href: "/logistics?tab=shipments&status=in_transit",
  },
  monthlyExpenses: {
    title: "Monthly Expenses",
    accent: "border-l-destructive",
    href: "/expenses?tab=daily",
  },
  monthlyProcurementValue: {
    title: "Monthly Procurement",
    accent: "border-l-chart-1",
    href: "/procurement",
  },
  monthlyShipments: {
    title: "Monthly Shipments",
    accent: "border-l-chart-4",
    href: "/logistics?tab=shipments",
  },
};

function buildKpis(
  role: AppRole,
  metrics: Partial<Record<DashboardKpiKey, { value: number; note: string }>>,
): DashboardKpi[] {
  return getDashboardKpiKeysForRole(role).flatMap((key) => {
    const metric = metrics[key];
    if (!metric) {
      return [];
    }

    const meta = KPI_META[key];
    return [
      {
        key,
        title: meta.title,
        value: formatKpiValue(key, metric.value),
        note: metric.note,
        href: meta.href,
        accent: meta.accent,
      },
    ];
  });
}

async function loadRecentActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  role: AppRole,
): Promise<DashboardRecentActivity> {
  const empty: DashboardRecentActivity = {
    procurements: [],
    payments: [],
    shipments: [],
    expenses: [],
  };

  if (role !== "super_admin" && role !== "admin") {
    return empty;
  }

  const [procurementsResult, paymentsResult, shipmentsResult, dailyResult, operationalResult] =
    await Promise.all([
      supabase
        .from("procurement_batches")
        .select("id, batch_number, procurement_date, total_kg, suppliers(supplier_name)")
        .order("procurement_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(DASHBOARD_RECENT_LIMIT),
      supabase
        .from("supplier_payments")
        .select("id, payment_reference, payment_date, amount, status")
        .order("payment_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(DASHBOARD_RECENT_LIMIT),
      supabase
        .from("shipments")
        .select("id, shipment_number, container_number, loading_date, status")
        .order("loading_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(DASHBOARD_RECENT_LIMIT),
      supabase
        .from("daily_expenses")
        .select("id, description, expense_date, amount")
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(DASHBOARD_RECENT_LIMIT),
      supabase
        .from("operational_expenses")
        .select("id, expense_type, expense_date, total_amount")
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(DASHBOARD_RECENT_LIMIT),
    ]);

  if (procurementsResult.error) {
    throw new Error(procurementsResult.error.message);
  }
  if (paymentsResult.error) {
    throw new Error(paymentsResult.error.message);
  }
  if (shipmentsResult.error) {
    throw new Error(shipmentsResult.error.message);
  }
  if (dailyResult.error) {
    throw new Error(dailyResult.error.message);
  }
  if (operationalResult.error) {
    throw new Error(operationalResult.error.message);
  }

  const expenseRows = [
    ...(dailyResult.data ?? []).map((row) => ({
      id: row.id as string,
      kind: "daily" as const,
      label: row.description as string,
      amount: Number(row.amount),
      expenseDate: row.expense_date as string,
    })),
    ...(operationalResult.data ?? []).map((row) => ({
      id: row.id as string,
      kind: "operational" as const,
      label: String(row.expense_type).replaceAll("_", " "),
      amount: Number(row.total_amount),
      expenseDate: row.expense_date as string,
    })),
  ]
    .sort((left, right) => right.expenseDate.localeCompare(left.expenseDate))
    .slice(0, DASHBOARD_RECENT_LIMIT);

  return {
    procurements: (procurementsResult.data ?? []).map((row) => {
      const supplier = joinOne(
        row.suppliers as
          | { supplier_name: string }
          | { supplier_name: string }[]
          | null,
      );
      return {
        id: row.id,
        batchNumber: row.batch_number,
        supplierName: supplier?.supplier_name ?? "—",
        totalKg: Number(row.total_kg),
        procurementDate: row.procurement_date,
      };
    }),
    payments: (paymentsResult.data ?? []).map((row) => ({
      id: row.id,
      paymentReference: row.payment_reference,
      amount: Number(row.amount),
      paymentDate: row.payment_date,
      status: row.status,
    })),
    shipments: (shipmentsResult.data ?? []).map((row) => ({
      id: row.id,
      shipmentNumber: row.shipment_number,
      containerNumber: row.container_number,
      loadingDate: row.loading_date,
      status: row.status,
    })),
    expenses: expenseRows,
  };
}

async function loadDashboardOverview(role: AppRole): Promise<DashboardOverview> {
  const supabase = await createClient();
  const [metrics, recentActivity] = await Promise.all([
    loadMetricValues(supabase, role),
    loadRecentActivity(supabase, role),
  ]);

  return {
    kpis: buildKpis(role, metrics),
    recentActivity,
  };
}

async function loadDashboardTrends(role: AppRole): Promise<DashboardTrends> {
  const supabase = await createClient();
  const monthKeys = monthKeysForTrend(DASHBOARD_TREND_MONTHS);
  const startDate = trendStartDate(DASHBOARD_TREND_MONTHS);
  const emptyTrend = monthKeys.map((monthKey) => ({
    monthKey,
    label: formatMonthLabel(monthKey),
    value: 0,
  }));

  const [procurementResult, inventoryResult, expenseDailyResult, expenseOperationalResult, shipmentResult] =
    await Promise.all([
      canSeeFinancialTrends(role)
        ? supabase
            .from("procurement_batches")
            .select("procurement_date, total_kg")
            .eq("status", "approved")
            .gte("procurement_date", startDate)
        : Promise.resolve({ data: [], error: null }),
      canSeeInventoryTrends(role)
        ? supabase
            .from("inventory_batches")
            .select("date_graded, total_kg")
            .gte("date_graded", startDate)
        : Promise.resolve({ data: [], error: null }),
      canSeeFinancialTrends(role)
        ? supabase
            .from("daily_expenses")
            .select("expense_date, amount")
            .eq("status", "payment_made")
            .gte("expense_date", startDate)
        : Promise.resolve({ data: [], error: null }),
      canSeeFinancialTrends(role)
        ? supabase
            .from("operational_expenses")
            .select("expense_date, total_amount")
            .eq("status", "payment_made")
            .gte("expense_date", startDate)
        : Promise.resolve({ data: [], error: null }),
      canSeeLogisticsTrends(role)
        ? supabase
            .from("shipments")
            .select("loading_date, total_kg")
            .gte("loading_date", startDate)
        : Promise.resolve({ data: [], error: null }),
    ]);

  for (const result of [
    procurementResult,
    inventoryResult,
    expenseDailyResult,
    expenseOperationalResult,
    shipmentResult,
  ]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  const expenseRows = [
    ...(expenseDailyResult.data ?? []).map((row) => ({
      date: row.expense_date as string,
      value: Number(row.amount),
    })),
    ...(expenseOperationalResult.data ?? []).map((row) => ({
      date: row.expense_date as string,
      value: Number(row.total_amount),
    })),
  ];

  return {
    procurement: canSeeFinancialTrends(role)
      ? buildTrend(
          (procurementResult.data ?? []).map((row) => ({
            date: row.procurement_date as string,
            value: Number(row.total_kg),
          })),
          monthKeys,
        )
      : emptyTrend,
    inventory: canSeeInventoryTrends(role)
      ? buildTrend(
          (inventoryResult.data ?? []).map((row) => ({
            date: row.date_graded as string,
            value: Number(row.total_kg),
          })),
          monthKeys,
        )
      : emptyTrend,
    expenses: canSeeFinancialTrends(role)
      ? buildTrend(expenseRows, monthKeys)
      : emptyTrend,
    shipments: canSeeLogisticsTrends(role)
      ? buildTrend(
          (shipmentResult.data ?? []).map((row) => ({
            date: row.loading_date as string,
            value: Number(row.total_kg),
          })),
          monthKeys,
        )
      : emptyTrend,
  };
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const { appUser } = await getSessionUser();
  const role: AppRole = normalizeAppRole(appUser?.role);
  const userId = appUser?.id ?? "anonymous";
  const cacheKey = `${userId}:${role}`;
  const cached = dashboardOverviewCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const value = await loadDashboardOverview(role);

  dashboardOverviewCache.set(cacheKey, value);
  return value;
}

export async function getDashboardTrends(): Promise<DashboardTrends> {
  const { appUser } = await getSessionUser();
  const role: AppRole = normalizeAppRole(appUser?.role);
  const userId = appUser?.id ?? "anonymous";
  const cacheKey = `${userId}:${role}`;
  const cached = dashboardTrendsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const value = await loadDashboardTrends(role);

  dashboardTrendsCache.set(cacheKey, value);
  return value;
}

export async function getReportsPageData(): Promise<{
  kpis: DashboardOverview["kpis"];
  trends: DashboardTrends;
  recentActivity: DashboardRecentActivity;
}> {
  const [trends, overview] = await Promise.all([
    getDashboardTrends(),
    getDashboardOverview(),
  ]);

  return {
    kpis: overview.kpis,
    trends,
    recentActivity: overview.recentActivity,
  };
}
