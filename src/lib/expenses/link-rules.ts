import type { OperationalExpenseType } from "@/lib/expenses/constants";

export type ExpenseLinkField =
  | "processing_session_id"
  | "inventory_batch_id"
  | "procurement_batch_id"
  | "pre_stock_id"
  | "shipment_id"
  | null;

export type ExpenseLinkLoaderKey =
  | "processing"
  | "inventory"
  | "off_site_procurement"
  | "pre_stock"
  | "shipment";

export type ExpenseLinkRule = {
  requiredField: ExpenseLinkField;
  loaderKey: ExpenseLinkLoaderKey | null;
  disabled?: boolean;
  disabledReason?: string;
};

export const OPERATIONAL_EXPENSE_LINK_RULES: Record<
  OperationalExpenseType,
  ExpenseLinkRule
> = {
  cleaning: {
    requiredField: "processing_session_id",
    loaderKey: "processing",
  },
  field_transfer_out: {
    requiredField: "processing_session_id",
    loaderKey: "processing",
  },
  grading: {
    requiredField: "inventory_batch_id",
    loaderKey: "inventory",
  },
  truck_offloading: {
    requiredField: "procurement_batch_id",
    loaderKey: "off_site_procurement",
  },
  field_transfer_in: {
    requiredField: "pre_stock_id",
    loaderKey: "pre_stock",
    // Waste bags (broken flowers, etc.) → warehouse transfer: deferred until
    // Waste management module (post Phase 8/9). See SETUP.md Phase 7 deferred.
  },
  warehouse_loading: {
    requiredField: "shipment_id",
    loaderKey: "shipment",
  },
  miscellaneous: {
    requiredField: null,
    loaderKey: null,
  },
};

export function calcOperationalTotal(bags: number, ratePerBag: number): number {
  return Math.round(bags * ratePerBag * 100) / 100;
}
