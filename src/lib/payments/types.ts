import type {
  PaymentMethod,
  PaymentQueueFilter,
  PaymentRecordStatus,
} from "@/lib/payments/constants";
import type { PaymentStatus } from "@/lib/procurement/constants";

export type PaymentDashboardCounts = {
  outstanding: number;
  partial: number;
  completed: number;
  pendingApproval: number;
};

export type PaymentQueueRow = {
  batch_id: string;
  batch_number: string;
  supplier_id: string;
  supplier_code: string;
  supplier_name: string;
  product_type: string;
  batch_value: number;
  paid_total: number;
  outstanding: number;
  payment_status: PaymentStatus;
  procurement_date: string;
};

export type PaymentBankAccountSummary = {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  is_primary: boolean;
};

export type PaymentHistoryRow = {
  id: string;
  payment_reference: string;
  supplier_id: string;
  supplier_code: string;
  supplier_name: string;
  batch_id: string;
  batch_number: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  status: PaymentRecordStatus;
  bank_account_id: string | null;
  bank_account: PaymentBankAccountSummary | null;
  approved_by_name: string | null;
  recorded_by_name: string | null;
};

export type SupplierPaymentRow = PaymentHistoryRow;

export type SupplierWithOutstandingOption = {
  id: string;
  supplier_code: string;
  supplier_name: string;
  outstanding_total: number;
};

export type BatchPaymentOption = {
  id: string;
  batch_number: string;
  product_type: string;
  batch_value: number;
  paid_total: number;
  outstanding: number;
  payment_status: PaymentStatus;
};

export type BatchPaymentSummary = {
  batch_id: string;
  batch_number: string;
  supplier_id: string;
  supplier_name: string;
  supplier_code: string;
  product_type: string;
  batch_value: number;
  paid_total: number;
  outstanding: number;
  payment_status: PaymentStatus;
  procurement_status: string;
};

export type SupplierPaymentDetail = {
  id: string;
  payment_reference: string;
  supplier_id: string;
  supplier_code: string;
  supplier_name: string;
  batch_id: string;
  batch_number: string;
  product_type: string;
  batch_value: number;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  status: PaymentRecordStatus;
  notes: string | null;
  bank_account_id: string | null;
  bank_account: PaymentBankAccountSummary | null;
  recorded_by_name: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  created_at: string;
};

export type PaymentQueueFilterParam = PaymentQueueFilter | "all";
