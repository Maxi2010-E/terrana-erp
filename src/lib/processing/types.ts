import type {
  ProcessingSessionStatus,
  WasteType,
} from "@/lib/processing/constants";
import type {
  ProcurementType,
  ProductCondition,
} from "@/lib/procurement/constants";

export type ProcessingQueueRow = {
  id: string;
  batch_number: string;
  product_type: string;
  supplier_name: string;
  number_of_bags: number;
  bags_remaining: number;
  total_kg: number;
  procurement_date: string;
  product_condition: ProductCondition;
};

export type ProcessingSessionListRow = {
  id: string;
  session_number: string;
  batch_number: string;
  product_type: string;
  bags_sent: number;
  input_kg: number;
  output_kg: number | null;
  yield_pct: number | null;
  status: ProcessingSessionStatus;
  processing_date: string;
};

export type WasteRecordEntry = {
  number_of_bags: number;
  kg_per_bag: number | null;
  extra_kg: number;
  weight_kg: number;
};

export type ProcessingSessionDetail = {
  id: string;
  session_number: string;
  source_batch_id: string;
  batch_number: string;
  product_type: string;
  product_condition: ProductCondition;
  procurement_type: ProcurementType;
  supplier_name: string;
  batch_total_bags: number;
  batch_bags_remaining: number;
  processing_date: string;
  bags_sent: number;
  input_kg: number;
  output_kg: number | null;
  yield_pct: number | null;
  status: ProcessingSessionStatus;
  processed_by: string | null;
  processed_by_label: string | null;
  notes: string | null;
  completed_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  approved_by_name: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejected_by_name: string | null;
  created_at: string;
  output: {
    bags_produced: number;
    kg_per_bag: number | null;
    extra_kg: number;
    total_kg: number;
  } | null;
  waste: Record<WasteType, WasteRecordEntry>;
};

export type ProcessingPendingSessionRow = {
  id: string;
  session_number: string;
  batch_number: string;
  product_type: string;
  supplier_name: string;
  bags_sent: number;
  input_kg: number;
  processing_date: string;
  created_at: string;
};

export type ProcessingBatchOption = {
  id: string;
  batch_number: string;
  product_type: string;
  bags_remaining: number;
};
