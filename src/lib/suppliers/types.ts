import type { SupplierStatus } from "@/lib/suppliers/constants";

export type Supplier = {
  id: string;
  supplier_code: string;
  supplier_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: SupplierStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SupplierBankAccount = {
  id: string;
  supplier_id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type SupplierListRow = {
  id: string;
  supplier_code: string;
  supplier_name: string;
  phone: string | null;
  status: SupplierStatus;
};
