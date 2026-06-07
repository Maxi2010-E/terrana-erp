import type { InventoryStatus, PreStockSourceType } from "@/lib/inventory/constants";
import type { TraceabilityLink } from "@/lib/inventory/traceability-links";

export type { TraceabilityLink };

export type PreStockListRow = {
  id: string;
  pre_stock_number: string;
  source_type: PreStockSourceType;
  source_id: string;
  source_links: TraceabilityLink[];
  product_type: string;
  /** Bags still available in the pre-stock room */
  bags: number;
  bags_received: number;
  total_kg: number;
  total_kg_received: number;
  date_received: string;
  status: InventoryStatus;
};

export type ExportInventoryStockLine = {
  product_type: string;
  batch_count: number;
  bags: number;
  total_kg: number;
};

export type ExportInventoryStockBoard = {
  lines: ExportInventoryStockLine[];
  total_batches: number;
  total_bags: number;
  total_kg: number;
};

export type WarehouseLotListRow = {
  id: string;
  lot_code: string;
  label: string;
  stacked_date: string | null;
  batch_count: number;
  bags_on_hand: number;
};

export type WarehouseLotDetail = {
  id: string;
  lot_code: string;
  label: string;
  location_notes: string | null;
  stacked_date: string | null;
  created_at: string;
  updated_at: string;
  batches: WarehouseLotBatchRow[];
};

export type WarehouseLotBatchRow = {
  id: string;
  inventory_number: string;
  product_type: string;
  bags: number;
  total_kg: number;
  date_graded: string;
  status: InventoryStatus;
};

export type WarehouseLotOption = {
  id: string;
  lot_code: string;
  label: string;
};

export type InventoryBatchListRow = {
  id: string;
  inventory_number: string;
  product_type: string;
  bags: number;
  total_kg: number;
  date_graded: string;
  status: InventoryStatus;
  warehouse_lot_id: string | null;
  warehouse_lot_label: string | null;
  source_count: number;
  mix_sources: InventoryMixSourceLine[];
  mix_summary: InventoryMixSummary | null;
};

export type InventoryMixSourceLine = {
  pre_stock_number: string;
  source_product_type: string;
  bags: number;
  total_kg: number;
};

export type InventoryMixSummary = {
  input_bags: number;
  input_kg: number;
  output_bags: number;
  output_kg: number;
};

export type InventorySourceRow = {
  id: string;
  pre_stock_id: string;
  pre_stock_number: string;
  source_type: PreStockSourceType;
  source_links: TraceabilityLink[];
  source_product_type: string;
  bags: number;
  total_kg: number;
  date_received: string;
};

export type InventoryBatchDetail = {
  id: string;
  inventory_number: string;
  product_type: string;
  bags: number;
  total_kg: number;
  date_graded: string;
  status: InventoryStatus;
  notes: string | null;
  created_at: string;
  grade_composition: GradeComposition | null;
  sources: InventorySourceRow[];
};

export type GradeCompositionLine = {
  pre_stock_id: string;
  source_product_type: string;
  bags: number;
  total_kg: number;
};

export type GradeComposition = {
  lines: GradeCompositionLine[];
  derived_label: string;
  /** Bags taken from pre-stock before mix */
  input_bags?: number;
  input_kg?: number;
  /** Actual export bags / KG after mix and re-bag to 25 kg standard */
  output_bags?: number;
  output_kg?: number;
  nominal_output_kg?: number;
  bag_variance?: number;
  kg_variance?: number;
};

export type AvailablePreStockOption = {
  id: string;
  pre_stock_number: string;
  source_links: TraceabilityLink[];
  product_type: string;
  bags: number;
  bags_received: number;
  total_kg: number;
  total_kg_received: number;
  date_received: string;
};

export type GradeLineInput = {
  preStockId: string;
  bags: number;
};
