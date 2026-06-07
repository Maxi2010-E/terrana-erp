import type {
  DailyExpenseCategory,
  ExpensePaymentMethod,
  ExpenseRecordStatus,
  OperationalExpenseType,
} from "@/lib/expenses/constants";
import type { AppRole } from "@/lib/roles";

export type ExpenseLinkOption = {
  id: string;
  label: string;
  href?: string;
};

/** Processing session option with bags sent for auto-fill (cleaning, field transfer out). */
export type ProcessingExpenseLinkOption = ExpenseLinkOption & {
  bagsSent: number;
};

/** Inventory batch option with bag count for auto-fill (grading expenses). */
export type InventoryExpenseLinkOption = ExpenseLinkOption & {
  bags: number;
};

/** Off-site procurement option with bag count for auto-fill (truck offloading). */
export type ProcurementExpenseLinkOption = ExpenseLinkOption & {
  bags: number;
};

/** Pre-stock option with bag count for auto-fill (field transfer in). */
export type PreStockExpenseLinkOption = ExpenseLinkOption & {
  bags: number;
};

/** Shipment option with bag count for auto-fill (warehouse loading). */
export type ShipmentExpenseLinkOption = ExpenseLinkOption & {
  bags: number;
};

export type OperationalExpenseLinkOptions = {
  cleaningProcessingSessions: ProcessingExpenseLinkOption[];
  fieldTransferOutProcessingSessions: ProcessingExpenseLinkOption[];
  processingSessions: ExpenseLinkOption[];
  inventoryBatches: InventoryExpenseLinkOption[];
  offSiteProcurement: ProcurementExpenseLinkOption[];
  preStock: PreStockExpenseLinkOption[];
  shipments: ShipmentExpenseLinkOption[];
};

export type PettyCashTopUpRow = {
  id: string;
  amount_added: number;
  date_added: string;
  added_by: string | null;
  added_by_name: string | null;
  notes: string | null;
};

export type PettyCashSummary = {
  balance: number;
  lastTopUp: PettyCashTopUpRow | null;
  totalTopUps: number;
};

export type DailyExpenseListRow = {
  id: string;
  expense_date: string;
  expense_category: DailyExpenseCategory;
  description: string;
  amount: number;
  payment_method: ExpensePaymentMethod;
  status: ExpenseRecordStatus;
  entered_by: string | null;
  entered_by_name: string | null;
  entered_by_role: AppRole | null;
  approved_by: string | null;
  approved_by_name: string | null;
  notes: string | null;
};

export type OperationalExpenseListRow = {
  id: string;
  expense_type: OperationalExpenseType;
  expense_date: string;
  description: string | null;
  bags: number;
  rate_per_bag: number;
  total_amount: number;
  payment_method: ExpensePaymentMethod;
  status: ExpenseRecordStatus;
  paid_by: string | null;
  paid_by_name: string | null;
  paid_by_role: AppRole | null;
  approved_by: string | null;
  approved_by_name: string | null;
  link_label: string;
  link_href: string | null;
  notes: string | null;
};
