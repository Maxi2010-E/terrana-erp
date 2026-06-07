export type DashboardKpiKey =
  | "procurementKg"
  | "currentInventoryKg"
  | "totalSuppliers"
  | "outstandingPayments"
  | "containersInTransit"
  | "monthlyExpenses"
  | "monthlyProcurementValue"
  | "monthlyShipments";

export type DashboardKpi = {
  key: DashboardKpiKey;
  title: string;
  value: string;
  note: string;
  href?: string;
  accent: string;
};

export type TrendPoint = {
  label: string;
  monthKey: string;
  value: number;
};

export type DashboardTrends = {
  procurement: TrendPoint[];
  inventory: TrendPoint[];
  expenses: TrendPoint[];
  shipments: TrendPoint[];
};

export type RecentProcurementRow = {
  id: string;
  batchNumber: string;
  supplierName: string;
  totalKg: number;
  procurementDate: string;
};

export type RecentPaymentRow = {
  id: string;
  paymentReference: string;
  amount: number;
  paymentDate: string;
  status: string;
};

export type RecentShipmentRow = {
  id: string;
  shipmentNumber: string;
  containerNumber: string;
  loadingDate: string;
  status: string;
};

export type RecentExpenseRow = {
  id: string;
  kind: "daily" | "operational";
  label: string;
  amount: number;
  expenseDate: string;
};

export type DashboardRecentActivity = {
  procurements: RecentProcurementRow[];
  payments: RecentPaymentRow[];
  shipments: RecentShipmentRow[];
  expenses: RecentExpenseRow[];
};

export type DashboardOverview = {
  kpis: DashboardKpi[];
  recentActivity: DashboardRecentActivity;
};
