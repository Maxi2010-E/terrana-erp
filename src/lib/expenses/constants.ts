export const DAILY_EXPENSE_CATEGORIES = [
  "utilities",
  "repairs",
  "maintenance",
  "office_supplies",
  "others",
] as const;

export type DailyExpenseCategory = (typeof DAILY_EXPENSE_CATEGORIES)[number];

export const OPERATIONAL_EXPENSE_TYPES = [
  "cleaning",
  "grading",
  "field_transfer_out",
  "field_transfer_in",
  "truck_offloading",
  "warehouse_loading",
  "miscellaneous",
] as const;

export type OperationalExpenseType = (typeof OPERATIONAL_EXPENSE_TYPES)[number];

export const EXPENSE_RECORD_STATUSES = [
  "pending_approval",
  "approved",
  "payment_made",
] as const;

/** Submitted or approved — blocks duplicate operational expense links. */
export const EXPENSE_IN_FLIGHT_STATUSES = [
  "pending_approval",
  "approved",
  "payment_made",
] as const;

export type ExpenseRecordStatus = (typeof EXPENSE_RECORD_STATUSES)[number];

export const EXPENSE_PAYMENT_METHODS = ["cash", "transfer"] as const;
export type ExpensePaymentMethod = (typeof EXPENSE_PAYMENT_METHODS)[number];

export const DAILY_EXPENSE_CATEGORY_LABELS: Record<DailyExpenseCategory, string> =
  {
    utilities: "Utilities",
    repairs: "Repairs",
    maintenance: "Maintenance",
    office_supplies: "Office supplies",
    others: "Others",
  };

export const OPERATIONAL_EXPENSE_TYPE_LABELS: Record<
  OperationalExpenseType,
  string
> = {
  cleaning: "Cleaning",
  grading: "Grading",
  field_transfer_out: "Field transfer out",
  field_transfer_in: "Field transfer in",
  truck_offloading: "Truck offloading",
  warehouse_loading: "Warehouse loading",
  miscellaneous: "Miscellaneous",
};

export const EXPENSE_RECORD_STATUS_LABELS: Record<ExpenseRecordStatus, string> =
  {
    pending_approval: "Pending approval",
    approved: "Approved — pay now",
    payment_made: "Paid",
  };

export const EXPENSE_PAYMENT_METHOD_LABELS: Record<
  ExpensePaymentMethod,
  string
> = {
  cash: "Cash",
  transfer: "Transfer",
};
