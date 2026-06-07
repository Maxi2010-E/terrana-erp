import type {
  MixedType,
  PaymentStatus,
  ProcurementStatus,
  ProcurementType,
  ProductAge,
  ProductColor,
  ProductCondition,
  QualityDecision,
} from "@/lib/procurement/constants";

export type ProcurementBatch = {
  id: string;
  batch_number: string;
  procurement_type: ProcurementType;
  product_condition: ProductCondition;
  product_age: ProductAge | null;
  product_color: ProductColor | null;
  mixed_type: MixedType | null;
  product_type: string;
  supplier_id: string;
  number_of_bags: number;
  kg_per_bag: number | null;
  extra_kg: number;
  total_kg: number;
  unit_price: number | null;
  total_value: number | null;
  procurement_date: string;
  received_by: string | null;
  quality_decision: QualityDecision;
  payment_status: PaymentStatus;
  status: ProcurementStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  approved_by: string | null;
  approved_at: string | null;
  approved_by_name?: string | null;
  supplier_name?: string;
  supplier_code?: string;
};

export type ProcurementListRow = Pick<
  ProcurementBatch,
  | "id"
  | "batch_number"
  | "procurement_type"
  | "product_condition"
  | "product_type"
  | "number_of_bags"
  | "kg_per_bag"
  | "extra_kg"
  | "total_kg"
  | "status"
  | "payment_status"
  | "procurement_date"
  | "supplier_id"
  | "unit_price"
  | "total_value"
> & {
  supplier_name: string;
};

export type SupplierOption = {
  id: string;
  supplier_code: string;
  supplier_name: string;
};

export type EmployeeOption = {
  id: string;
  employee_code: string;
  label: string;
};
