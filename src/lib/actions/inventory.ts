"use server";

import { revalidatePath } from "next/cache";

import {
  requireInventoryRead,
  requireInventoryWrite,
} from "@/lib/auth/require-role";
import { PAGE_SIZE } from "@/lib/employees/constants";
import type {
  InventoryStatus,
  PreStockSourceType,
} from "@/lib/inventory/constants";
import type {
  AvailablePreStockOption,
  GradeComposition,
  GradeLineInput,
  InventoryBatchDetail,
  InventoryBatchListRow,
  InventorySourceRow,
  PreStockListRow,
} from "@/lib/inventory/types";
import {
  buildGradeComposition,
  proportionalKg,
} from "@/lib/inventory/graded-product-type";
import { formatProcurementBatchNumber } from "@/lib/procurement/batch-number";
import { createClient } from "@/lib/supabase/server";

type PreStockRow = {
  id: string;
  pre_stock_number: string;
  source_type: PreStockSourceType;
  source_id: string;
  product_type: string;
  bags: number;
  bags_received: number;
  total_kg: number;
  total_kg_received: number;
  date_received: string;
  status: InventoryStatus;
};

type InventorySourceLinkRow = {
  id: string;
  pre_stock_id: string;
  bags: number;
  total_kg: number;
  source_product_type: string;
  pre_stock: PreStockRow | PreStockRow[];
};

type SourceMeta = {
  label: string;
  href: string | null;
};

async function resolveProcessingSources(
  sessionIds: string[],
): Promise<Map<string, SourceMeta>> {
  const map = new Map<string, SourceMeta>();

  if (sessionIds.length === 0) {
    return map;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("processing_sessions")
    .select(
      `
      id,
      session_number,
      procurement_batches!inner(batch_number)
    `,
    )
    .in("id", sessionIds);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of data ?? []) {
    const batchJoin = row.procurement_batches as
      | { batch_number: string }
      | { batch_number: string }[];
    const batch = Array.isArray(batchJoin) ? batchJoin[0] : batchJoin;
    const batchNumber = batch?.batch_number ?? "—";

    map.set(row.id, {
      label: `${row.session_number} · ${formatProcurementBatchNumber(batchNumber)}`,
      href: `/processing/${row.id}`,
    });
  }

  return map;
}

async function resolveProcurementSources(
  batchIds: string[],
): Promise<Map<string, SourceMeta>> {
  const map = new Map<string, SourceMeta>();

  if (batchIds.length === 0) {
    return map;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("procurement_batches")
    .select("id, batch_number")
    .in("id", batchIds);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of data ?? []) {
    map.set(row.id, {
      label: formatProcurementBatchNumber(row.batch_number),
      href: `/procurement/${row.id}`,
    });
  }

  return map;
}

async function enrichPreStockRows(
  rows: PreStockRow[],
): Promise<PreStockListRow[]> {
  const processingIds = rows
    .filter((row) => row.source_type === "processing")
    .map((row) => row.source_id);
  const procurementIds = rows
    .filter((row) => row.source_type === "procurement")
    .map((row) => row.source_id);

  const [processingSources, procurementSources] = await Promise.all([
    resolveProcessingSources(processingIds),
    resolveProcurementSources(procurementIds),
  ]);

  return rows.map((row) => {
    const meta =
      row.source_type === "processing"
        ? processingSources.get(row.source_id)
        : procurementSources.get(row.source_id);

    return {
      id: row.id,
      pre_stock_number: row.pre_stock_number,
      source_type: row.source_type,
      source_id: row.source_id,
      source_label: meta?.label ?? "—",
      source_href: meta?.href ?? null,
      product_type: row.product_type,
      bags: Number(row.bags),
      bags_received: Number(row.bags_received ?? row.bags),
      total_kg: Number(row.total_kg),
      total_kg_received: Number(row.total_kg_received ?? row.total_kg),
      date_received: row.date_received,
      status: row.status,
    };
  });
}

export async function getPreStockList(
  page: number,
  query: string,
  statusFilter?: InventoryStatus | "all",
): Promise<{ rows: PreStockListRow[]; total: number }> {
  await requireInventoryRead();

  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let builder = supabase
    .from("pre_stock")
    .select(
      `
      id,
      pre_stock_number,
      source_type,
      source_id,
      product_type,
      bags,
      bags_received,
      total_kg,
      total_kg_received,
      date_received,
      status
    `,
      { count: "exact" },
    )
    .order("date_received", { ascending: false })
    .order("pre_stock_number", { ascending: false })
    .range(from, to);

  if (statusFilter && statusFilter !== "all") {
    builder = builder.eq("status", statusFilter);
  }

  const trimmed = query.trim();
  if (trimmed) {
    const term = `%${trimmed}%`;
    builder = builder.or(
      `pre_stock_number.ilike.${term},product_type.ilike.${term}`,
    );
  }

  const { data, count, error } = await builder;

  if (error) {
    throw new Error(error.message);
  }

  const rows = await enrichPreStockRows((data ?? []) as PreStockRow[]);

  return { rows, total: count ?? 0 };
}

export async function getAvailablePreStockForInventory(): Promise<
  AvailablePreStockOption[]
> {
  await requireInventoryWrite();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pre_stock")
    .select(
      `
      id,
      pre_stock_number,
      source_type,
      source_id,
      product_type,
      bags,
      bags_received,
      total_kg,
      total_kg_received,
      date_received,
      status
    `,
    )
    .eq("status", "available")
    .gt("bags", 0)
    .order("date_received", { ascending: true })
    .order("pre_stock_number", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const enriched = await enrichPreStockRows((data ?? []) as PreStockRow[]);

  return enriched.map((row) => ({
    id: row.id,
    pre_stock_number: row.pre_stock_number,
    source_label: row.source_label,
    product_type: row.product_type,
    bags: row.bags,
    bags_received: row.bags_received,
    total_kg: row.total_kg,
    total_kg_received: row.total_kg_received,
    date_received: row.date_received,
  }));
}

export async function getInventoryBatchesList(
  page: number,
  query: string,
): Promise<{ rows: InventoryBatchListRow[]; total: number }> {
  await requireInventoryRead();

  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let builder = supabase
    .from("inventory_batches")
    .select(
      `
      id,
      inventory_number,
      product_type,
      bags,
      total_kg,
      date_graded,
      status,
      grade_composition,
      inventory_sources (
        id,
        bags,
        total_kg,
        source_product_type,
        pre_stock!inner (
          pre_stock_number
        )
      )
    `,
      { count: "exact" },
    )
    .order("date_graded", { ascending: false })
    .order("inventory_number", { ascending: false })
    .range(from, to);

  const trimmed = query.trim();
  if (trimmed) {
    const term = `%${trimmed}%`;
    builder = builder.or(
      `inventory_number.ilike.${term},product_type.ilike.${term}`,
    );
  }

  const { data, count, error } = await builder;

  if (error) {
    throw new Error(error.message);
  }

  const rows: InventoryBatchListRow[] = (data ?? []).map((row) => {
    const sources = (row.inventory_sources ?? []) as {
      bags: number;
      total_kg: number;
      source_product_type: string;
      pre_stock:
        | { pre_stock_number: string }
        | { pre_stock_number: string }[];
    }[];

    const mix_sources = sources.map((source) => {
      const preStockJoin = source.pre_stock;
      const preStock = Array.isArray(preStockJoin) ? preStockJoin[0] : preStockJoin;

      return {
        pre_stock_number: preStock?.pre_stock_number ?? "—",
        source_product_type: source.source_product_type,
        bags: Number(source.bags),
        total_kg: Number(source.total_kg),
      };
    });

    const composition = row.grade_composition as GradeComposition | null;
    const mix_summary =
      composition?.input_kg != null && composition.output_kg != null
        ? {
            input_bags: composition.input_bags ?? mix_sources.reduce((s, l) => s + l.bags, 0),
            input_kg: composition.input_kg,
            output_bags: composition.output_bags ?? Number(row.bags),
            output_kg: composition.output_kg,
          }
        : null;

    return {
      id: row.id,
      inventory_number: row.inventory_number,
      product_type: row.product_type,
      bags: Number(row.bags),
      total_kg: Number(row.total_kg),
      date_graded: row.date_graded,
      status: row.status as InventoryStatus,
      source_count: mix_sources.length,
      mix_sources,
      mix_summary,
    };
  });

  return { rows, total: count ?? 0 };
}

export async function getInventoryBatchById(
  id: string,
): Promise<InventoryBatchDetail | null> {
  await requireInventoryRead();

  const supabase = await createClient();
  const { data: batch, error } = await supabase
    .from("inventory_batches")
    .select(
      `
      id,
      inventory_number,
      product_type,
      bags,
      total_kg,
      date_graded,
      status,
      notes,
      created_at,
      grade_composition
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!batch) {
    return null;
  }

  const { data: sourceLinks, error: sourcesError } = await supabase
    .from("inventory_sources")
    .select(
      `
      id,
      pre_stock_id,
      bags,
      total_kg,
      source_product_type,
      pre_stock!inner(
        pre_stock_number,
        source_type,
        source_id,
        date_received
      )
    `,
    )
    .eq("inventory_batch_id", id);

  if (sourcesError) {
    throw new Error(sourcesError.message);
  }

  const preStockRows: PreStockRow[] = (sourceLinks ?? []).map((link) => {
    const row = link as InventorySourceLinkRow;
    const preStockJoin = row.pre_stock;
    const preStock = Array.isArray(preStockJoin) ? preStockJoin[0] : preStockJoin;

    return {
      id: row.pre_stock_id,
      pre_stock_number: preStock.pre_stock_number,
      source_type: preStock.source_type,
      source_id: preStock.source_id,
      product_type: row.source_product_type,
      bags: row.bags,
      bags_received: row.bags,
      total_kg: row.total_kg,
      total_kg_received: row.total_kg,
      date_received: preStock.date_received,
      status: "allocated" as InventoryStatus,
    };
  });

  const enriched = await enrichPreStockRows(preStockRows);

  const sources: InventorySourceRow[] = (sourceLinks ?? []).map((link, index) => {
    const row = link as InventorySourceLinkRow;
    const enrichedRow = enriched[index];

    return {
      id: row.id,
      pre_stock_id: row.pre_stock_id,
      pre_stock_number: enrichedRow.pre_stock_number,
      source_type: enrichedRow.source_type,
      source_label: enrichedRow.source_label,
      source_href: enrichedRow.source_href,
      source_product_type: row.source_product_type,
      bags: Number(row.bags),
      total_kg: Number(row.total_kg),
      date_received: enrichedRow.date_received,
    };
  });

  return {
    id: batch.id,
    inventory_number: batch.inventory_number,
    product_type: batch.product_type,
    bags: Number(batch.bags),
    total_kg: Number(batch.total_kg),
    date_graded: batch.date_graded,
    status: batch.status as InventoryStatus,
    notes: batch.notes,
    created_at: batch.created_at,
    grade_composition: (batch.grade_composition as GradeComposition | null) ?? null,
    sources,
  };
}

export type CreateInventoryFormState = {
  error?: string;
  success?: boolean;
  batchId?: string;
};

function parseGradeLines(raw: FormDataEntryValue | null): GradeLineInput[] | null {
  if (typeof raw !== "string" || !raw.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return null;
    }

    const lines: GradeLineInput[] = [];
    for (const item of parsed) {
      if (
        typeof item !== "object" ||
        item === null ||
        typeof (item as GradeLineInput).preStockId !== "string" ||
        typeof (item as GradeLineInput).bags !== "number"
      ) {
        return null;
      }

      const line = item as GradeLineInput;
      if (!line.preStockId.trim() || line.bags <= 0) {
        return null;
      }

      lines.push({
        preStockId: line.preStockId.trim(),
        bags: Math.floor(line.bags),
      });
    }

    return lines.length > 0 ? lines : null;
  } catch {
    return null;
  }
}

export async function createInventoryBatch(
  _prev: CreateInventoryFormState,
  formData: FormData,
): Promise<CreateInventoryFormState> {
  const { authUser } = await requireInventoryWrite();

  const gradeLines = parseGradeLines(formData.get("grade_lines"));
  if (!gradeLines) {
    return { error: "Add at least one pre-stock line with bags to grade." };
  }

  const dateGraded = String(formData.get("date_graded") ?? "").trim();
  if (!dateGraded) {
    return { error: "Date graded is required." };
  }

  const notes = String(formData.get("notes") ?? "").trim() || null;

  const outputBags = Number.parseInt(
    String(formData.get("output_bags") ?? "").trim(),
    10,
  );
  const outputKg = Number.parseFloat(
    String(formData.get("output_kg") ?? "").trim(),
  );

  if (!Number.isFinite(outputBags) || outputBags <= 0) {
    return { error: "Enter export bags after mix (post re-bag count)." };
  }

  if (!Number.isFinite(outputKg) || outputKg <= 0) {
    return { error: "Enter total export KG after mix and re-bagging." };
  }

  const preStockIds = [...new Set(gradeLines.map((line) => line.preStockId))];
  const supabase = await createClient();
  const { data: preStockRows, error: fetchError } = await supabase
    .from("pre_stock")
    .select(
      "id, product_type, bags, bags_received, total_kg, total_kg_received, status",
    )
    .in("id", preStockIds);

  if (fetchError) {
    return { error: fetchError.message };
  }

  if ((preStockRows ?? []).length !== preStockIds.length) {
    return { error: "One or more pre-stock records could not be found." };
  }

  const preStockById = new Map(
    (preStockRows ?? []).map((row) => [row.id as string, row]),
  );

  const compositionLines: {
    pre_stock_id: string;
    source_product_type: string;
    bags: number;
    total_kg: number;
  }[] = [];

  for (const line of gradeLines) {
    const row = preStockById.get(line.preStockId);
    if (!row) {
      return { error: "One or more pre-stock records could not be found." };
    }

    if (row.status !== "available") {
      return {
        error: "Only available pre-stock records can be graded into export inventory.",
      };
    }

    const bagsAvailable = Number(row.bags);
    if (line.bags > bagsAvailable) {
      return {
        error: `Not enough bags available on pre-stock ${line.preStockId}.`,
      };
    }

    const kgTaken = proportionalKg(
      line.bags,
      bagsAvailable,
      Number(row.total_kg),
    );

    if (kgTaken <= 0) {
      return { error: "Graded KG must be greater than zero." };
    }

    compositionLines.push({
      pre_stock_id: line.preStockId,
      source_product_type: row.product_type as string,
      bags: line.bags,
      total_kg: kgTaken,
    });
  }

  const inputKg = compositionLines.reduce((sum, line) => sum + line.total_kg, 0);

  if (inputKg <= 0) {
    return { error: "Pre-mix input KG must be greater than zero." };
  }

  const gradeComposition = buildGradeComposition(compositionLines, {
    bags: outputBags,
    total_kg: Math.round(outputKg * 1000) / 1000,
  });
  const productType = gradeComposition.derived_label;

  const { data: inserted, error: insertError } = await supabase
    .from("inventory_batches")
    .insert({
      product_type: productType,
      bags: outputBags,
      total_kg: Math.round(outputKg * 1000) / 1000,
      date_graded: dateGraded,
      status: "available",
      notes,
      grade_composition: gradeComposition,
      created_by: authUser?.id ?? null,
    })
    .select("id, inventory_number")
    .single();

  if (insertError || !inserted) {
    return { error: insertError?.message ?? "Could not create inventory batch." };
  }

  const sourceRows = compositionLines.map((line) => ({
    inventory_batch_id: inserted.id,
    pre_stock_id: line.pre_stock_id,
    bags: line.bags,
    total_kg: line.total_kg,
    source_product_type: line.source_product_type,
  }));

  const { error: sourcesError } = await supabase
    .from("inventory_sources")
    .insert(sourceRows);

  if (sourcesError) {
    await supabase.from("inventory_batches").delete().eq("id", inserted.id);
    return { error: sourcesError.message };
  }

  for (const line of compositionLines) {
    const row = preStockById.get(line.pre_stock_id)!;
    const bagsAvailable = Number(row.bags);
    const kgAvailable = Number(row.total_kg);
    const newBags = bagsAvailable - line.bags;
    const newKg = Math.round((kgAvailable - line.total_kg) * 1000) / 1000;
    const newStatus: InventoryStatus =
      newBags <= 0 ? "allocated" : "available";

    const { error: updateError } = await supabase
      .from("pre_stock")
      .update({
        bags: newBags,
        total_kg: newKg > 0 ? newKg : 0,
        status: newStatus,
      })
      .eq("id", line.pre_stock_id)
      .eq("status", "available");

    if (updateError) {
      await supabase
        .from("inventory_sources")
        .delete()
        .eq("inventory_batch_id", inserted.id);
      await supabase.from("inventory_batches").delete().eq("id", inserted.id);
      return { error: updateError.message };
    }
  }

  revalidatePath("/inventory/pre-stock");
  revalidatePath("/inventory/export");
  revalidatePath("/dashboard", "layout");
  return { success: true, batchId: inserted.id };
}
