import type { ProcessingSessionStatus, WasteType } from "@/lib/processing/constants";
import type { WasteSourceKind } from "@/lib/waste/reprocessing-constants";
import type { WasteRecordEntry } from "@/lib/processing/types";

export type WasteReprocessingQueueRow = {
  source_id: string;
  source_kind: WasteSourceKind;
  waste_record_id: string | null;
  byproduct_id: string | null;
  waste_type: WasteType;
  total_kg: number;
  reprocessed_kg: number;
  reserved_kg: number;
  available_kg: number;
  origin_session_number: string;
  origin_batch_number: string;
  supplier_name: string;
  product_type: string;
  number_of_bags: number;
  kg_per_bag: number | null;
};

export type WasteReprocessingPendingSessionRow = {
  id: string;
  session_number: string;
  waste_type: WasteType;
  kg_sent: number;
  input_kg: number;
  processing_date: string;
  origin_session_number: string;
  local_product_label: string;
  source_kind: WasteSourceKind;
  created_at: string;
};

export type WasteReprocessingSessionListRow = {
  id: string;
  session_number: string;
  waste_type: WasteType;
  kg_sent: number;
  output_kg: number | null;
  status: ProcessingSessionStatus;
  processing_date: string;
  origin_session_number: string;
  product_label: string | null;
};

export type WasteReprocessingSourceOption = {
  source_id: string;
  source_kind: WasteSourceKind;
  waste_record_id: string | null;
  byproduct_id: string | null;
  waste_type: WasteType;
  available_kg: number;
  number_of_bags: number;
  kg_per_bag: number | null;
  origin_session_number: string;
  origin_batch_number: string;
  supplier_name: string;
  product_type: string;
  local_product_label: string;
};

export type WasteReprocessingSessionDetail = {
  id: string;
  session_number: string;
  source_kind: WasteSourceKind;
  waste_type: WasteType;
  waste_record_id: string | null;
  byproduct_id: string | null;
  origin_session_number: string;
  origin_batch_number: string;
  supplier_name: string;
  product_type: string;
  local_product_label: string;
  processing_date: string;
  number_of_bags: number;
  kg_per_bag: number | null;
  extra_kg: number;
  kg_sent: number;
  input_kg: number;
  output_kg: number | null;
  yield_pct: number | null;
  status: ProcessingSessionStatus;
  processed_by: string | null;
  processed_by_label: string | null;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  rejected_by_name: string | null;
  rejected_at: string | null;
  output: {
    product_label: string;
    bags_produced: number;
    kg_per_bag: number | null;
    extra_kg: number;
    total_kg: number;
  } | null;
  byproducts: Record<WasteType, WasteRecordEntry>;
  local_stock_number: string | null;
};

export type WasteLocalStockRow = {
  id: string;
  stock_number: string;
  product_label: string;
  source_waste_type: WasteType;
  bags: number;
  total_kg: number;
  date_received: string;
  status: "available" | "depleted";
  reprocessing_session_number: string;
};
