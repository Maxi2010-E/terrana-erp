export const SUPPLIER_STATUSES = ["active", "inactive"] as const;

export type SupplierStatus = (typeof SUPPLIER_STATUSES)[number];

export const SUPPLIER_STATUS_LABELS: Record<SupplierStatus, string> = {
  active: "Active",
  inactive: "Inactive",
};

export const SUPPLIER_TABS = [
  "overview",
  "bank",
  "procurements",
  "payments",
  "analytics",
] as const;

export type SupplierTab = (typeof SUPPLIER_TABS)[number];

export const SUPPLIER_TAB_LABELS: Record<SupplierTab, string> = {
  overview: "Overview",
  bank: "Bank Accounts",
  procurements: "Procurements",
  payments: "Payments",
  analytics: "Analytics",
};
