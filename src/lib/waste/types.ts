import type { ProcessingSessionStatus, WasteType } from "@/lib/processing/constants";

export type WasteListRow = {
  id: string;
  session_id: string;
  session_number: string;
  session_status: ProcessingSessionStatus;
  waste_type: WasteType;
  weight_kg: number;
  reprocessed_kg: number;
  number_of_bags: number;
  kg_per_bag: number | null;
  extra_kg: number;
  date_recorded: string;
  batch_id: string;
  batch_number: string;
  supplier_name: string;
  product_type: string;
};

export type WasteDashboardSummary = {
  total_kg: number;
  session_count: number;
  record_count: number;
  by_type: Record<WasteType, number>;
};
