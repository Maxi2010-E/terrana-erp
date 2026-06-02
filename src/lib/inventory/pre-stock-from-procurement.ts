import type { SupabaseClient } from "@supabase/supabase-js";

export type ProcurementBatchForPreStock = {
  id: string;
  quality_decision: string;
  product_type: string;
  number_of_bags: number;
  total_kg: number;
  procurement_date: string;
};

export async function ensurePreStockFromProcurementBatch(
  supabase: SupabaseClient,
  batch: ProcurementBatchForPreStock,
): Promise<{ created: boolean; error?: string }> {
  if (batch.quality_decision !== "pre_stock") {
    return { created: false };
  }

  const { data: existing, error: existingError } = await supabase
    .from("pre_stock")
    .select("id")
    .eq("source_type", "procurement")
    .eq("source_id", batch.id)
    .maybeSingle();

  if (existingError) {
    return { created: false, error: existingError.message };
  }

  if (existing) {
    return { created: false };
  }

  const { data: preStockNumber, error: numberError } =
    await supabase.rpc("generate_pre_stock_number");

  if (numberError || !preStockNumber) {
    return {
      created: false,
      error:
        numberError?.message ?? "Could not generate pre-stock number.",
    };
  }

  const { error: insertError } = await supabase.from("pre_stock").insert({
    pre_stock_number: preStockNumber as string,
    source_type: "procurement",
    source_id: batch.id,
    product_type: batch.product_type,
    bags: batch.number_of_bags,
    bags_received: batch.number_of_bags,
    total_kg: batch.total_kg,
    total_kg_received: batch.total_kg,
    date_received: batch.procurement_date,
    status: "available",
  });

  if (insertError) {
    return { created: false, error: insertError.message };
  }

  return { created: true };
}

export async function removePreStockForProcurementBatch(
  supabase: SupabaseClient,
  batchId: string,
): Promise<{ error?: string }> {
  const { data: preStock, error: fetchError } = await supabase
    .from("pre_stock")
    .select("id, status")
    .eq("source_type", "procurement")
    .eq("source_id", batchId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!preStock) {
    return {};
  }

  if (preStock.status === "allocated" || preStock.status === "shipped") {
    return {
      error:
        "Cannot unlock: pre-stock from this batch is already used in export inventory.",
    };
  }

  const { count: gradedCount, error: gradedError } = await supabase
    .from("inventory_sources")
    .select("id", { count: "exact", head: true })
    .eq("pre_stock_id", preStock.id);

  if (gradedError) {
    return { error: gradedError.message };
  }

  if ((gradedCount ?? 0) > 0) {
    return {
      error:
        "Cannot unlock: part of this pre-stock has already been graded into export inventory.",
    };
  }

  const { error: deleteError } = await supabase
    .from("pre_stock")
    .delete()
    .eq("id", preStock.id);

  if (deleteError) {
    return { error: deleteError.message };
  }

  return {};
}
