"use server";

import { revalidatePath } from "next/cache";

import { getActiveEmployeesForSelect } from "@/lib/actions/procurement";
import {
  requireProcessingApprove,
  requireProcessingRead,
  requireProcessingWrite,
} from "@/lib/auth/require-role";
import { requireActorUserId } from "@/lib/auth/actor-id";
import { PAGE_SIZE } from "@/lib/employees/constants";
import {
  calcWasteWeightKg,
  calcYieldPct,
} from "@/lib/processing/calculations";
import {
  ACTIVE_PROCESSING_SESSION_STATUSES,
  DEFAULT_WASTE_KG_PER_BAG,
  WASTE_TYPES,
  WASTE_TYPE_LABELS,
  isStandardWasteKgPerBag,
  type ProcessingSessionStatus,
  type WasteType,
} from "@/lib/processing/constants";
import type { WasteRecordEntry } from "@/lib/processing/types";
import { formatProcurementBatchNumber } from "@/lib/procurement/batch-number";
import {
  calcWasteAvailableKg,
  calcWasteReprocessingInputKg,
  calcWasteReprocessingOutputKg,
} from "@/lib/waste/reprocessing-calculations";
import { WASTE_REPROCESS_LOCAL_LABELS } from "@/lib/waste/reprocessing-constants";
import type { WasteReprocessingFormState } from "@/lib/waste/reprocessing-form-state";
import type {
  WasteLocalStockRow,
  WasteReprocessingPendingSessionRow,
  WasteReprocessingQueueRow,
  WasteReprocessingSessionDetail,
  WasteReprocessingSessionListRow,
  WasteReprocessingSourceOption,
} from "@/lib/waste/reprocessing-types";
import { createClient } from "@/lib/supabase/server";
import { nameFromMap, resolveUserDisplayNames } from "@/lib/users/resolve-user-names";

function parseNumber(value: FormDataEntryValue | null): number | undefined {
  const text = String(value ?? "").trim();
  if (!text) {
    return undefined;
  }

  const parsed = Number.parseFloat(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

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

async function sumReservedKgForWasteRecord(
  wasteRecordId: string,
  excludeSessionId?: string,
): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("waste_reprocessing_sessions")
    .select("kg_sent, id")
    .eq("source_waste_record_id", wasteRecordId)
    .in("status", [...ACTIVE_PROCESSING_SESSION_STATUSES]);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce((sum, row) => {
    if (row.id === excludeSessionId) {
      return sum;
    }

    return sum + Number(row.kg_sent);
  }, 0);
}

async function sumReservedKgForByproduct(
  byproductId: string,
  excludeSessionId?: string,
): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("waste_reprocessing_sessions")
    .select("kg_sent, id")
    .eq("source_byproduct_id", byproductId)
    .in("status", [...ACTIVE_PROCESSING_SESSION_STATUSES]);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce((sum, row) => {
    if (row.id === excludeSessionId) {
      return sum;
    }

    return sum + Number(row.kg_sent);
  }, 0);
}

export async function getWasteReprocessingQueue(): Promise<
  WasteReprocessingQueueRow[]
> {
  await requireProcessingRead();

  const supabase = await createClient();
  const { data: collectionRows, error: collectionError } = await supabase
    .from("waste_records")
    .select(
      `
      id,
      waste_type,
      weight_kg,
      reprocessed_kg,
      number_of_bags,
      kg_per_bag,
      processing_sessions!inner (
        session_number,
        status,
        procurement_batches!inner (
          batch_number,
          product_type,
          suppliers!inner (supplier_name)
        )
      )
    `,
    )
    .gt("weight_kg", 0);

  if (collectionError) {
    throw new Error(collectionError.message);
  }

  const queue: WasteReprocessingQueueRow[] = [];

  for (const row of collectionRows ?? []) {
    const sessionJoin = row.processing_sessions as
      | {
          session_number: string;
          status: string;
          procurement_batches:
            | {
                batch_number: string;
                product_type: string;
                suppliers:
                  | { supplier_name: string }
                  | { supplier_name: string }[];
              }
            | Array<{
                batch_number: string;
                product_type: string;
                suppliers:
                  | { supplier_name: string }
                  | { supplier_name: string }[];
              }>;
        }
      | Array<{
          session_number: string;
          status: string;
          procurement_batches:
            | {
                batch_number: string;
                product_type: string;
                suppliers:
                  | { supplier_name: string }
                  | { supplier_name: string }[];
              }
            | Array<{
                batch_number: string;
                product_type: string;
                suppliers:
                  | { supplier_name: string }
                  | { supplier_name: string }[];
              }>;
        }>;

    const session = Array.isArray(sessionJoin) ? sessionJoin[0] : sessionJoin;
    if (!session || session.status !== "completed") {
      continue;
    }

    const batchJoin = session.procurement_batches;
    const batch = Array.isArray(batchJoin) ? batchJoin[0] : batchJoin;
    const totalKg = Number(row.weight_kg);
    const reprocessedKg = Number(row.reprocessed_kg ?? 0);
    const reservedKg = await sumReservedKgForWasteRecord(row.id as string);
    const availableKg = calcWasteAvailableKg(
      totalKg,
      reprocessedKg,
      reservedKg,
    );

    if (availableKg <= 0) {
      continue;
    }

    queue.push({
      source_id: row.id as string,
      source_kind: "collection",
      waste_record_id: row.id as string,
      byproduct_id: null,
      waste_type: row.waste_type as WasteType,
      total_kg: totalKg,
      reprocessed_kg: reprocessedKg,
      reserved_kg: reservedKg,
      available_kg: availableKg,
      origin_session_number: session.session_number,
      origin_batch_number: formatProcurementBatchNumber(batch.batch_number),
      supplier_name: supplierName(batch.suppliers),
      product_type: batch.product_type,
      number_of_bags: Number(row.number_of_bags ?? 0),
      kg_per_bag: row.kg_per_bag != null ? Number(row.kg_per_bag) : null,
    });
  }

  const { data: byproductRows, error: byproductError } = await supabase
    .from("waste_reprocessing_byproducts")
    .select(
      `
      id,
      waste_type,
      weight_kg,
      reprocessed_kg,
      number_of_bags,
      kg_per_bag,
      waste_reprocessing_session_id
    `,
    )
    .gt("weight_kg", 0);

  if (byproductError) {
    if (!byproductError.message.includes("waste_reprocessing_byproducts")) {
      throw new Error(byproductError.message);
    }
  } else {
    const parentSessionIds = [
      ...new Set(
        (byproductRows ?? []).map(
          (row) => row.waste_reprocessing_session_id as string,
        ),
      ),
    ];

    const sessionNumberById = new Map<string, string>();
    if (parentSessionIds.length > 0) {
      const { data: parentSessions, error: parentSessionError } = await supabase
        .from("waste_reprocessing_sessions")
        .select("id, session_number")
        .in("id", parentSessionIds);

      if (parentSessionError) {
        throw new Error(parentSessionError.message);
      }

      for (const session of parentSessions ?? []) {
        sessionNumberById.set(
          session.id as string,
          session.session_number as string,
        );
      }
    }

    for (const row of byproductRows ?? []) {
      const totalKg = Number(row.weight_kg);
      const reprocessedKg = Number(row.reprocessed_kg ?? 0);
      const reservedKg = await sumReservedKgForByproduct(row.id as string);
      const availableKg = calcWasteAvailableKg(
        totalKg,
        reprocessedKg,
        reservedKg,
      );

      if (availableKg <= 0) {
        continue;
      }

      const parentSessionId = row.waste_reprocessing_session_id as string;

      queue.push({
        source_id: row.id as string,
        source_kind: "byproduct",
        waste_record_id: null,
        byproduct_id: row.id as string,
        waste_type: row.waste_type as WasteType,
        total_kg: totalKg,
        reprocessed_kg: reprocessedKg,
        reserved_kg: reservedKg,
        available_kg: availableKg,
        origin_session_number:
          sessionNumberById.get(parentSessionId) ?? "—",
        origin_batch_number: "Re-process waste",
        supplier_name: "—",
        product_type: WASTE_TYPE_LABELS[row.waste_type as WasteType],
        number_of_bags: Number(row.number_of_bags ?? 0),
        kg_per_bag: row.kg_per_bag != null ? Number(row.kg_per_bag) : null,
      });
    }
  }

  queue.sort((a, b) => b.available_kg - a.available_kg);
  return queue;
}

export async function getWasteReprocessingSourceOption(
  sourceId: string,
  sourceKind: "collection" | "byproduct",
): Promise<WasteReprocessingSourceOption | null> {
  await requireProcessingRead();
  const queue = await getWasteReprocessingQueue();
  const row = queue.find(
    (item) => item.source_id === sourceId && item.source_kind === sourceKind,
  );

  if (!row) {
    return null;
  }

  return {
    source_id: row.source_id,
    source_kind: row.source_kind,
    waste_record_id: row.waste_record_id,
    byproduct_id: row.byproduct_id,
    waste_type: row.waste_type,
    available_kg: row.available_kg,
    number_of_bags: row.number_of_bags,
    kg_per_bag: row.kg_per_bag,
    origin_session_number: row.origin_session_number,
    origin_batch_number: row.origin_batch_number,
    supplier_name: row.supplier_name,
    product_type: row.product_type,
    local_product_label: WASTE_REPROCESS_LOCAL_LABELS[row.waste_type],
  };
}

export async function getPendingWasteReprocessingSessions(): Promise<
  WasteReprocessingPendingSessionRow[]
> {
  await requireProcessingApprove();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("waste_reprocessing_sessions")
    .select(
      `
      id,
      session_number,
      waste_type,
      kg_sent,
      input_kg,
      processing_date,
      created_at,
      source_waste_record_id,
      waste_records (
        processing_sessions (session_number)
      )
    `,
    )
    .eq("status", "pending_approval")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message.includes("waste_reprocessing_sessions")) {
      return [];
    }
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const wasteRecordJoin = row.waste_records as
      | {
          processing_sessions:
            | { session_number: string }
            | { session_number: string }[];
        }
      | Array<{
          processing_sessions:
            | { session_number: string }
            | { session_number: string }[];
        }>
      | null;
    const wasteRecord = Array.isArray(wasteRecordJoin)
      ? wasteRecordJoin[0]
      : wasteRecordJoin;
    const sessionJoin = wasteRecord?.processing_sessions;
    const originSession = Array.isArray(sessionJoin)
      ? sessionJoin[0]
      : sessionJoin;

    return {
      id: row.id as string,
      session_number: row.session_number as string,
      waste_type: row.waste_type as WasteType,
      kg_sent: Number(row.kg_sent),
      input_kg: Number(row.input_kg),
      processing_date: row.processing_date as string,
      origin_session_number: originSession?.session_number ?? "Re-process",
      local_product_label:
        WASTE_REPROCESS_LOCAL_LABELS[row.waste_type as WasteType],
      source_kind: row.source_waste_record_id
        ? ("collection" as const)
        : ("byproduct" as const),
      created_at: row.created_at as string,
    };
  });
}

export async function getMyPendingWasteReprocessingSessions(): Promise<
  WasteReprocessingPendingSessionRow[]
> {
  const { authUser } = await requireProcessingRead();

  if (!authUser) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("waste_reprocessing_sessions")
    .select(
      `
      id,
      session_number,
      waste_type,
      kg_sent,
      input_kg,
      processing_date,
      created_at,
      source_waste_record_id,
      waste_records (
        processing_sessions (session_number)
      )
    `,
    )
    .eq("status", "pending_approval")
    .eq("created_by", authUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message.includes("waste_reprocessing_sessions")) {
      return [];
    }
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const wasteRecordJoin = row.waste_records as
      | {
          processing_sessions:
            | { session_number: string }
            | { session_number: string }[];
        }
      | Array<{
          processing_sessions:
            | { session_number: string }
            | { session_number: string }[];
        }>
      | null;
    const wasteRecord = Array.isArray(wasteRecordJoin)
      ? wasteRecordJoin[0]
      : wasteRecordJoin;
    const sessionJoin = wasteRecord?.processing_sessions;
    const originSession = Array.isArray(sessionJoin)
      ? sessionJoin[0]
      : sessionJoin;

    return {
      id: row.id as string,
      session_number: row.session_number as string,
      waste_type: row.waste_type as WasteType,
      kg_sent: Number(row.kg_sent),
      input_kg: Number(row.input_kg),
      processing_date: row.processing_date as string,
      origin_session_number: originSession?.session_number ?? "Re-process",
      local_product_label:
        WASTE_REPROCESS_LOCAL_LABELS[row.waste_type as WasteType],
      source_kind: row.source_waste_record_id
        ? ("collection" as const)
        : ("byproduct" as const),
      created_at: row.created_at as string,
    };
  });
}

export async function getWasteReprocessingSessionsList(
  page: number,
  query: string,
): Promise<{ rows: WasteReprocessingSessionListRow[]; total: number }> {
  await requireProcessingRead();

  const supabase = await createClient();
  const offset = (Math.max(1, page) - 1) * PAGE_SIZE;
  const trimmedQuery = query.trim();

  let request = supabase
    .from("waste_reprocessing_sessions")
    .select(
      `
      id,
      session_number,
      waste_type,
      kg_sent,
      output_kg,
      status,
      processing_date,
      source_waste_record_id,
      waste_reprocessing_outputs (product_label),
      waste_records (
        processing_sessions (session_number)
      )
    `,
      { count: "exact" },
    )
    .order("processing_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (trimmedQuery) {
    request = request.ilike("session_number", `%${trimmedQuery}%`);
  }

  const { data, error, count } = await request.range(
    offset,
    offset + PAGE_SIZE - 1,
  );

  if (error) {
    throw new Error(error.message);
  }

  const rows: WasteReprocessingSessionListRow[] = (data ?? []).map((row) => {
    const outputJoin = row.waste_reprocessing_outputs as
      | { product_label: string }
      | { product_label: string }[]
      | null;
    const output = Array.isArray(outputJoin) ? outputJoin[0] : outputJoin;

    const wasteRecordJoin = row.waste_records as
      | {
          processing_sessions:
            | { session_number: string }
            | { session_number: string }[];
        }
      | Array<{
          processing_sessions:
            | { session_number: string }
            | { session_number: string }[];
        }>
      | null;
    const wasteRecord = Array.isArray(wasteRecordJoin)
      ? wasteRecordJoin[0]
      : wasteRecordJoin;
    const sessionJoin = wasteRecord?.processing_sessions;
    const originSession = Array.isArray(sessionJoin)
      ? sessionJoin[0]
      : sessionJoin;

    return {
      id: row.id as string,
      session_number: row.session_number as string,
      waste_type: row.waste_type as WasteType,
      kg_sent: Number(row.kg_sent),
      output_kg: row.output_kg != null ? Number(row.output_kg) : null,
      status: row.status as ProcessingSessionStatus,
      processing_date: row.processing_date as string,
      origin_session_number: originSession?.session_number ?? "—",
      product_label: output?.product_label ?? null,
    };
  });

  return { rows, total: count ?? 0 };
}

export async function getWasteLocalStockList(): Promise<WasteLocalStockRow[]> {
  await requireProcessingRead();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("waste_local_stock")
    .select(
      `
      id,
      stock_number,
      product_label,
      source_waste_type,
      bags,
      total_kg,
      date_received,
      status,
      waste_reprocessing_sessions (session_number)
    `,
    )
    .order("date_received", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const sessionJoin = row.waste_reprocessing_sessions as
      | { session_number: string }
      | { session_number: string }[];
    const session = Array.isArray(sessionJoin) ? sessionJoin[0] : sessionJoin;

    return {
      id: row.id as string,
      stock_number: row.stock_number as string,
      product_label: row.product_label as string,
      source_waste_type: row.source_waste_type as WasteType,
      bags: Number(row.bags),
      total_kg: Number(row.total_kg),
      date_received: row.date_received as string,
      status: row.status as "available" | "depleted",
      reprocessing_session_number: session?.session_number ?? "—",
    };
  });
}

export async function startWasteReprocessingSession(
  _prev: WasteReprocessingFormState,
  formData: FormData,
): Promise<WasteReprocessingFormState> {
  const { authUser } = await requireProcessingWrite();
  if (!authUser) {
    return { error: "You must be signed in to start re-processing." };
  }

  const sourceKind = String(formData.get("source_kind") ?? "").trim();
  const sourceId = String(formData.get("source_id") ?? "").trim();
  const processingDate = String(formData.get("processing_date") ?? "").trim();
  const kgSent = parseNumber(formData.get("kg_sent"));
  const numberOfBags =
    Number.parseInt(String(formData.get("number_of_bags") ?? ""), 10) || 0;
  const kgPerBagRaw = parseNumber(formData.get("kg_per_bag"));
  const extraKg = parseNumber(formData.get("extra_kg")) ?? 0;
  const processedBy = String(formData.get("processed_by") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (sourceKind !== "collection" && sourceKind !== "byproduct") {
    return { error: "Invalid waste source." };
  }

  if (!sourceId) {
    return { error: "Select a waste source." };
  }

  if (!processingDate) {
    return { error: "Processing date is required." };
  }

  const source = await getWasteReprocessingSourceOption(
    sourceId,
    sourceKind,
  );

  if (!source) {
    return { error: "This waste is no longer available for re-processing." };
  }

  const resolvedKgSent =
    kgSent ??
    calcWasteWeightKg({
      number_of_bags: numberOfBags,
      kg_per_bag: kgPerBagRaw ?? null,
      extra_kg: extraKg,
    });

  if (resolvedKgSent <= 0) {
    return { error: "Enter kg to send or bags with package weight." };
  }

  if (resolvedKgSent > source.available_kg) {
    return {
      error: `Only ${source.available_kg.toLocaleString()} kg available on this waste line.`,
    };
  }

  const inputKg = calcWasteReprocessingInputKg({
    number_of_bags: numberOfBags,
    kg_per_bag: kgPerBagRaw ?? null,
    extra_kg: extraKg,
    kg_sent: resolvedKgSent,
  });

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from("waste_reprocessing_sessions")
    .insert({
      source_waste_record_id: source.waste_record_id,
      source_byproduct_id: source.byproduct_id,
      waste_type: source.waste_type,
      processing_date: processingDate,
      number_of_bags: Math.max(0, numberOfBags),
      kg_per_bag: kgPerBagRaw ?? null,
      extra_kg: Math.max(0, extraKg),
      kg_sent: resolvedKgSent,
      input_kg: inputKg,
      processed_by: processedBy,
      created_by: authUser.id,
      notes,
      status: "pending_approval" as ProcessingSessionStatus,
    })
    .select("id")
    .single();

  if (error) {
    if (error.message.includes("waste_reprocessing_sessions")) {
      return {
        error:
          "Waste re-processing tables are not set up yet. Run migration 00048 in Supabase.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/waste");
  return { success: true, sessionId: inserted.id as string };
}

function parseOutput(formData: FormData) {
  const bagsProduced =
    Number.parseInt(String(formData.get("output_bags") ?? ""), 10) || 0;
  const kgPerBagRaw = parseNumber(formData.get("output_kg_per_bag"));
  const extraKg = parseNumber(formData.get("output_extra_kg")) ?? 0;
  const hasKgPerBag =
    kgPerBagRaw != null && kgPerBagRaw > 0 && isStandardWasteKgPerBag(kgPerBagRaw);

  return {
    bags_produced: Math.max(0, bagsProduced),
    kg_per_bag: hasKgPerBag ? kgPerBagRaw : bagsProduced > 0 ? kgPerBagRaw ?? 25 : null,
    extra_kg: Math.max(0, extraKg),
  };
}

function parseByproducts(formData: FormData): Record<WasteType, WasteRecordEntry> {
  const byproducts = {} as Record<WasteType, WasteRecordEntry>;

  for (const type of WASTE_TYPES) {
    const numberOfBags =
      Number.parseInt(String(formData.get(`byproduct_${type}_bags`) ?? ""), 10) ||
      0;
    const kgPerBagRaw = parseNumber(formData.get(`byproduct_${type}_kg_per_bag`));
    const extraKg = parseNumber(formData.get(`byproduct_${type}_extra_kg`)) ?? 0;
    const kgPerBag =
      numberOfBags > 0
        ? (kgPerBagRaw ?? DEFAULT_WASTE_KG_PER_BAG)
        : (kgPerBagRaw ?? null);

    byproducts[type] = {
      number_of_bags: Math.max(0, numberOfBags),
      kg_per_bag: kgPerBag,
      extra_kg: Math.max(0, extraKg),
      weight_kg: calcWasteWeightKg({
        number_of_bags: Math.max(0, numberOfBags),
        kg_per_bag: kgPerBag,
        extra_kg: Math.max(0, extraKg),
      }),
    };
  }

  return byproducts;
}

async function upsertWasteReprocessingOutputAndByproducts(
  sessionId: string,
  productLabel: string,
  output: ReturnType<typeof parseOutput>,
  byproducts: Record<WasteType, WasteRecordEntry>,
): Promise<string | null> {
  const totalKg = calcWasteReprocessingOutputKg(output);
  const supabase = await createClient();

  const { data: existingOutput } = await supabase
    .from("waste_reprocessing_outputs")
    .select("id")
    .eq("waste_reprocessing_session_id", sessionId)
    .maybeSingle();

  if (existingOutput) {
    const { error } = await supabase
      .from("waste_reprocessing_outputs")
      .update({
        product_label: productLabel,
        bags_produced: output.bags_produced,
        kg_per_bag: output.kg_per_bag ?? null,
        extra_kg: output.extra_kg,
        total_kg: totalKg,
      })
      .eq("waste_reprocessing_session_id", sessionId);

    if (error) {
      return error.message;
    }
  } else {
    const { error } = await supabase.from("waste_reprocessing_outputs").insert({
      waste_reprocessing_session_id: sessionId,
      product_label: productLabel,
      bags_produced: output.bags_produced,
      kg_per_bag: output.kg_per_bag ?? null,
      extra_kg: output.extra_kg,
      total_kg: totalKg,
    });

    if (error) {
      return error.message;
    }
  }

  for (const type of WASTE_TYPES) {
    const entry = byproducts[type];

    if (entry.weight_kg <= 0) {
      await supabase
        .from("waste_reprocessing_byproducts")
        .delete()
        .eq("waste_reprocessing_session_id", sessionId)
        .eq("waste_type", type);
      continue;
    }

    const { error } = await supabase.from("waste_reprocessing_byproducts").upsert(
      {
        waste_reprocessing_session_id: sessionId,
        waste_type: type,
        number_of_bags: entry.number_of_bags,
        kg_per_bag: entry.kg_per_bag,
        extra_kg: entry.extra_kg,
        weight_kg: entry.weight_kg,
        date_recorded: new Date().toISOString().slice(0, 10),
      },
      { onConflict: "waste_reprocessing_session_id,waste_type" },
    );

    if (error) {
      return error.message;
    }
  }

  return null;
}

export async function getWasteReprocessingSessionById(
  id: string,
): Promise<WasteReprocessingSessionDetail | null> {
  await requireProcessingRead();

  const supabase = await createClient();
  const [
    { data, error },
    { data: byproductRows, error: byproductError },
  ] = await Promise.all([
    supabase
      .from("waste_reprocessing_sessions")
      .select(
        `
        *,
        waste_reprocessing_outputs (
          product_label,
          bags_produced,
          kg_per_bag,
          extra_kg,
          total_kg
        ),
        waste_local_stock (stock_number),
        waste_records (
          processing_sessions (
            session_number,
            procurement_batches (
              batch_number,
              product_type,
              suppliers (supplier_name)
            )
          )
        )
      `,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("waste_reprocessing_byproducts")
      .select(
        "waste_type, number_of_bags, kg_per_bag, extra_kg, weight_kg",
      )
      .eq("waste_reprocessing_session_id", id),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  if (byproductError) {
    throw new Error(byproductError.message);
  }

  if (!data) {
    return null;
  }

  const outputJoin = data.waste_reprocessing_outputs as
    | {
        product_label: string;
        bags_produced: number;
        kg_per_bag: number | null;
        extra_kg: number;
        total_kg: number;
      }
    | Array<{
        product_label: string;
        bags_produced: number;
        kg_per_bag: number | null;
        extra_kg: number;
        total_kg: number;
      }>
    | null;
  const outputRow = Array.isArray(outputJoin) ? outputJoin[0] : outputJoin;

  const byproducts = Object.fromEntries(
    WASTE_TYPES.map((type) => [
      type,
      { number_of_bags: 0, kg_per_bag: null, extra_kg: 0, weight_kg: 0 },
    ]),
  ) as Record<WasteType, WasteRecordEntry>;

  for (const record of byproductRows ?? []) {
    const wasteType = record.waste_type as WasteType;
    byproducts[wasteType] = {
      number_of_bags: Number(record.number_of_bags ?? 0),
      kg_per_bag:
        record.kg_per_bag != null ? Number(record.kg_per_bag) : null,
      extra_kg: Number(record.extra_kg ?? 0),
      weight_kg: Number(record.weight_kg ?? 0),
    };
  }

  const stockJoin = data.waste_local_stock as
    | { stock_number: string }
    | { stock_number: string }[]
    | null;
  const stock = Array.isArray(stockJoin) ? stockJoin[0] : stockJoin;

  let originSessionNumber = "—";
  let originBatchNumber = "—";
  let supplierNameLabel = "—";
  let productType = WASTE_REPROCESS_LOCAL_LABELS[data.waste_type as WasteType];

  const wasteRecordJoin = data.waste_records as
    | {
        processing_sessions:
          | {
              session_number: string;
              procurement_batches:
                | {
                    batch_number: string;
                    product_type: string;
                    suppliers:
                      | { supplier_name: string }
                      | { supplier_name: string }[];
                  }
                | Array<{
                    batch_number: string;
                    product_type: string;
                    suppliers:
                      | { supplier_name: string }
                      | { supplier_name: string }[];
                  }>;
            }
          | Array<{
              session_number: string;
              procurement_batches:
                | {
                    batch_number: string;
                    product_type: string;
                    suppliers:
                      | { supplier_name: string }
                      | { supplier_name: string }[];
                  }
                | Array<{
                    batch_number: string;
                    product_type: string;
                    suppliers:
                      | { supplier_name: string }
                      | { supplier_name: string }[];
                  }>;
            }>;
      }
    | null;
  const wasteRecord = Array.isArray(wasteRecordJoin)
    ? wasteRecordJoin[0]
    : wasteRecordJoin;
  const originSessionJoin = wasteRecord?.processing_sessions;
  const originSession = Array.isArray(originSessionJoin)
    ? originSessionJoin[0]
    : originSessionJoin;

  if (originSession) {
    originSessionNumber = originSession.session_number;
    const batchJoin = originSession.procurement_batches;
    const batch = Array.isArray(batchJoin) ? batchJoin[0] : batchJoin;
    if (batch) {
      originBatchNumber = formatProcurementBatchNumber(batch.batch_number);
      supplierNameLabel = supplierName(batch.suppliers);
      productType = batch.product_type;
    }
  }

  let processedByLabel: string | null = null;
  if (data.processed_by) {
    const employees = await getActiveEmployeesForSelect();
    processedByLabel =
      employees.find((employee) => employee.id === data.processed_by)?.label ??
      null;
  }

  const nameByUserId = await resolveUserDisplayNames([
    data.approved_by,
    data.rejected_by,
  ]);

  return {
    id: data.id as string,
    session_number: data.session_number as string,
    source_kind: data.source_waste_record_id ? "collection" : "byproduct",
    waste_type: data.waste_type as WasteType,
    waste_record_id: data.source_waste_record_id as string | null,
    byproduct_id: data.source_byproduct_id as string | null,
    origin_session_number: originSessionNumber,
    origin_batch_number: originBatchNumber,
    supplier_name: supplierNameLabel,
    product_type: productType,
    local_product_label:
      WASTE_REPROCESS_LOCAL_LABELS[data.waste_type as WasteType],
    processing_date: data.processing_date as string,
    number_of_bags: Number(data.number_of_bags),
    kg_per_bag: data.kg_per_bag != null ? Number(data.kg_per_bag) : null,
    extra_kg: Number(data.extra_kg),
    kg_sent: Number(data.kg_sent),
    input_kg: Number(data.input_kg),
    output_kg: data.output_kg != null ? Number(data.output_kg) : null,
    yield_pct: data.yield_pct != null ? Number(data.yield_pct) : null,
    status: data.status as ProcessingSessionStatus,
    processed_by: data.processed_by as string | null,
    processed_by_label: processedByLabel,
    notes: data.notes as string | null,
    created_at: data.created_at as string,
    completed_at: data.completed_at as string | null,
    approved_by_name: nameFromMap(nameByUserId, data.approved_by),
    approved_at: data.approved_at as string | null,
    rejected_by_name: nameFromMap(nameByUserId, data.rejected_by),
    rejected_at: data.rejected_at as string | null,
    output: outputRow
      ? {
          product_label: outputRow.product_label,
          bags_produced: Number(outputRow.bags_produced),
          kg_per_bag:
            outputRow.kg_per_bag != null ? Number(outputRow.kg_per_bag) : null,
          extra_kg: Number(outputRow.extra_kg),
          total_kg: Number(outputRow.total_kg),
        }
      : null,
    byproducts,
    local_stock_number: stock?.stock_number ?? null,
  };
}

export async function updateWasteReprocessingSession(
  sessionId: string,
  _prev: WasteReprocessingFormState,
  formData: FormData,
): Promise<WasteReprocessingFormState> {
  await requireProcessingWrite();

  const supabase = await createClient();
  const { data: session, error } = await supabase
    .from("waste_reprocessing_sessions")
    .select("id, status, waste_type")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!session) {
    return { error: "Session not found." };
  }

  if (session.status !== "in_progress") {
    return { error: "Only in-progress sessions can be updated." };
  }

  const output = parseOutput(formData);
  const byproducts = parseByproducts(formData);
  const productLabel =
    WASTE_REPROCESS_LOCAL_LABELS[session.waste_type as WasteType];

  if (output.bags_produced <= 0 && output.extra_kg <= 0) {
    return { error: "Enter export bags or extra kg for local product output." };
  }

  const saveError = await upsertWasteReprocessingOutputAndByproducts(
    sessionId,
    productLabel,
    output,
    byproducts,
  );

  if (saveError) {
    return { error: saveError };
  }

  revalidatePath(`/waste/reprocessing/${sessionId}`);
  revalidatePath("/waste");
  return { success: true, sessionId };
}

export async function completeWasteReprocessingSession(
  sessionId: string,
  _prev: WasteReprocessingFormState,
  formData: FormData,
): Promise<WasteReprocessingFormState> {
  await requireProcessingWrite();

  const supabase = await createClient();
  const { data: session, error } = await supabase
    .from("waste_reprocessing_sessions")
    .select(
      "id, status, input_kg, kg_sent, waste_type, source_waste_record_id, source_byproduct_id",
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!session) {
    return { error: "Session not found." };
  }

  if (session.status !== "in_progress") {
    if (session.status === "pending_approval") {
      return { error: "Approve this session before completing re-processing." };
    }
    if (session.status === "rejected") {
      return { error: "This session was rejected." };
    }
    return { error: "This session is already completed." };
  }

  const output = parseOutput(formData);
  const byproducts = parseByproducts(formData);
  const productLabel =
    WASTE_REPROCESS_LOCAL_LABELS[session.waste_type as WasteType];

  if (output.bags_produced <= 0 && output.extra_kg <= 0) {
    return { error: "Enter export bags or extra kg for local product output." };
  }

  const saveError = await upsertWasteReprocessingOutputAndByproducts(
    sessionId,
    productLabel,
    output,
    byproducts,
  );

  if (saveError) {
    return { error: saveError };
  }

  const totalOutputKg = calcWasteReprocessingOutputKg(output);
  const yieldPct = calcYieldPct(Number(session.input_kg), totalOutputKg);

  const { data: stockNumber, error: stockNumberError } = await supabase.rpc(
    "generate_waste_local_stock_number",
  );

  if (stockNumberError) {
    return { error: stockNumberError.message };
  }

  const { error: stockError } = await supabase.from("waste_local_stock").insert({
    stock_number: stockNumber as string,
    waste_reprocessing_session_id: sessionId,
    source_waste_type: session.waste_type,
    product_label: productLabel,
    bags: output.bags_produced,
    total_kg: totalOutputKg,
    date_received: new Date().toISOString().slice(0, 10),
    status: "available",
  });

  if (stockError) {
    return { error: stockError.message };
  }

  if (session.source_waste_record_id) {
    const { data: wasteRecord, error: fetchWasteError } = await supabase
      .from("waste_records")
      .select("reprocessed_kg")
      .eq("id", session.source_waste_record_id)
      .single();

    if (fetchWasteError) {
      return { error: fetchWasteError.message };
    }

    const nextReprocessed =
      Number(wasteRecord.reprocessed_kg) + Number(session.kg_sent);

    const { error: updateWasteError } = await supabase
      .from("waste_records")
      .update({ reprocessed_kg: nextReprocessed })
      .eq("id", session.source_waste_record_id);

    if (updateWasteError) {
      return { error: updateWasteError.message };
    }
  } else if (session.source_byproduct_id) {
    const { data: byproduct, error: fetchByproductError } = await supabase
      .from("waste_reprocessing_byproducts")
      .select("reprocessed_kg")
      .eq("id", session.source_byproduct_id)
      .single();

    if (fetchByproductError) {
      return { error: fetchByproductError.message };
    }

    const nextReprocessed =
      Number(byproduct.reprocessed_kg) + Number(session.kg_sent);

    const { error: updateByproductError } = await supabase
      .from("waste_reprocessing_byproducts")
      .update({ reprocessed_kg: nextReprocessed })
      .eq("id", session.source_byproduct_id);

    if (updateByproductError) {
      return { error: updateByproductError.message };
    }
  }

  const { error: completeError } = await supabase
    .from("waste_reprocessing_sessions")
    .update({
      status: "completed",
      output_kg: totalOutputKg,
      yield_pct: yieldPct,
      completed_at: new Date().toISOString(),
      processing_date: String(formData.get("processing_date") ?? "").trim(),
      processed_by:
        String(formData.get("processed_by") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .eq("id", sessionId)
    .eq("status", "in_progress");

  if (completeError) {
    await supabase
      .from("waste_local_stock")
      .delete()
      .eq("waste_reprocessing_session_id", sessionId);
    return { error: completeError.message };
  }

  revalidatePath("/waste");
  revalidatePath(`/waste/reprocessing/${sessionId}`);
  return { success: true, sessionId };
}

export async function approveWasteReprocessingSession(
  sessionId: string,
): Promise<{ error?: string }> {
  const authSession = await requireProcessingApprove();
  const actorUserId = requireActorUserId(authSession);
  const supabase = await createClient();

  const { error } = await supabase
    .from("waste_reprocessing_sessions")
    .update({
      status: "in_progress",
      approved_by: actorUserId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("status", "pending_approval");

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/waste");
  revalidatePath(`/waste/reprocessing/${sessionId}`);
  return {};
}

export async function approveWasteReprocessingSessionAction(
  sessionId: string,
): Promise<void> {
  await approveWasteReprocessingSession(sessionId);
}

export async function rejectWasteReprocessingSessionAction(
  sessionId: string,
): Promise<void> {
  await rejectWasteReprocessingSession(sessionId);
}

export async function rejectWasteReprocessingSession(
  sessionId: string,
): Promise<{ error?: string }> {
  const authSession = await requireProcessingApprove();
  const actorUserId = requireActorUserId(authSession);
  const supabase = await createClient();

  const { error } = await supabase
    .from("waste_reprocessing_sessions")
    .update({
      status: "rejected",
      rejected_by: actorUserId,
      rejected_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("status", "pending_approval");

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/waste");
  revalidatePath(`/waste/reprocessing/${sessionId}`);
  return {};
}
