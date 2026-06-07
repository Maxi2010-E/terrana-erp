import { requireProcessingRead } from "@/lib/auth/require-role";
import {
  WASTE_TYPES,
  type ProcessingSessionStatus,
  type WasteType,
} from "@/lib/processing/constants";
import { formatProcurementBatchNumber } from "@/lib/procurement/batch-number";
import type { WasteDashboardSummary, WasteListRow } from "@/lib/waste/types";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 25;

type WasteRecordRow = {
  id: string;
  waste_type: WasteType;
  weight_kg: number;
  reprocessed_kg: number;
  number_of_bags: number;
  kg_per_bag: number | null;
  extra_kg: number;
  date_recorded: string;
  processing_sessions:
    | {
        id: string;
        session_number: string;
        status: ProcessingSessionStatus;
        source_batch_id: string;
        procurement_batches:
          | {
              id: string;
              batch_number: string;
              product_type: string;
              suppliers:
                | { supplier_name: string }
                | { supplier_name: string }[]
                | null;
            }
          | Array<{
              id: string;
              batch_number: string;
              product_type: string;
              suppliers:
                | { supplier_name: string }
                | { supplier_name: string }[]
                | null;
            }>;
      }
    | Array<{
        id: string;
        session_number: string;
        status: ProcessingSessionStatus;
        source_batch_id: string;
        procurement_batches:
          | {
              id: string;
              batch_number: string;
              product_type: string;
              suppliers:
                | { supplier_name: string }
                | { supplier_name: string }[]
                | null;
            }
          | Array<{
              id: string;
              batch_number: string;
              product_type: string;
              suppliers:
                | { supplier_name: string }
                | { supplier_name: string }[]
                | null;
            }>;
      }>;
};

function supplierName(
  join:
    | { supplier_name: string }
    | { supplier_name: string }[]
    | null
    | undefined,
): string {
  if (!join) {
    return "—";
  }

  const row = Array.isArray(join) ? join[0] : join;
  return row?.supplier_name ?? "—";
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapWasteRow(row: WasteRecordRow): WasteListRow {
  const session = firstRelation(row.processing_sessions);
  const batch = firstRelation(session?.procurement_batches);

  if (!session || !batch) {
    throw new Error("Waste record is missing processing session or batch data.");
  }

  return {
    id: row.id,
    session_id: session.id,
    session_number: session.session_number,
    session_status: session.status,
    waste_type: row.waste_type,
    weight_kg: Number(row.weight_kg),
    reprocessed_kg: Number(row.reprocessed_kg ?? 0),
    number_of_bags: Number(row.number_of_bags),
    kg_per_bag: row.kg_per_bag != null ? Number(row.kg_per_bag) : null,
    extra_kg: Number(row.extra_kg),
    date_recorded: row.date_recorded,
    batch_id: batch.id,
    batch_number: formatProcurementBatchNumber(batch.batch_number),
    supplier_name: supplierName(batch.suppliers),
    product_type: batch.product_type,
  };
}

function emptyByType(): Record<WasteType, number> {
  return Object.fromEntries(WASTE_TYPES.map((type) => [type, 0])) as Record<
    WasteType,
    number
  >;
}

export async function getWasteDashboardSummary(): Promise<WasteDashboardSummary> {
  await requireProcessingRead();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("waste_records")
    .select("waste_type, weight_kg, processing_session_id")
    .gt("weight_kg", 0);

  if (error) {
    throw new Error(error.message);
  }

  const by_type = emptyByType();
  let total_kg = 0;
  const sessionIds = new Set<string>();

  for (const row of data ?? []) {
    const kg = Number(row.weight_kg);
    total_kg += kg;
    by_type[row.waste_type as WasteType] += kg;
    sessionIds.add(row.processing_session_id as string);
  }

  return {
    total_kg: Math.round(total_kg * 1000) / 1000,
    session_count: sessionIds.size,
    record_count: data?.length ?? 0,
    by_type: Object.fromEntries(
      WASTE_TYPES.map((type) => [
        type,
        Math.round(by_type[type] * 1000) / 1000,
      ]),
    ) as Record<WasteType, number>,
  };
}

export async function getWasteRecordsList(
  page: number,
  query: string,
  wasteType?: WasteType,
): Promise<{ rows: WasteListRow[]; total: number }> {
  await requireProcessingRead();

  const supabase = await createClient();
  const offset = (Math.max(1, page) - 1) * PAGE_SIZE;
  const trimmedQuery = query.trim();

  let request = supabase
    .from("waste_records")
    .select(
      `
      id,
      waste_type,
      weight_kg,
      reprocessed_kg,
      number_of_bags,
      kg_per_bag,
      extra_kg,
      date_recorded,
      processing_sessions!inner (
        id,
        session_number,
        status,
        source_batch_id,
        procurement_batches!inner (
          id,
          batch_number,
          product_type,
          suppliers!inner (supplier_name)
        )
      )
    `,
      { count: "exact" },
    )
    .gt("weight_kg", 0)
    .order("date_recorded", { ascending: false })
    .order("id", { ascending: false });

  if (wasteType) {
    request = request.eq("waste_type", wasteType);
  }

  if (trimmedQuery) {
    request = request.ilike(
      "processing_sessions.session_number",
      `%${trimmedQuery}%`,
    );
  }

  const { data, error, count } = await request.range(
    offset,
    offset + PAGE_SIZE - 1,
  );

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []).map((row) =>
    mapWasteRow(row as unknown as WasteRecordRow),
  );

  return {
    rows,
    total: count ?? 0,
  };
}

export function sessionHasWaste(
  waste: Record<WasteType, { weight_kg: number }>,
): boolean {
  return WASTE_TYPES.some((type) => (waste[type]?.weight_kg ?? 0) > 0);
}

export function totalWasteKg(
  waste: Record<WasteType, { weight_kg: number }>,
): number {
  const total = WASTE_TYPES.reduce(
    (sum, type) => sum + (waste[type]?.weight_kg ?? 0),
    0,
  );

  return Math.round(total * 1000) / 1000;
}
