"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";

import {
  requireProcessingRead,
  requireProcessingWrite,
  requireProcessingApprove,
  requireSuperAdmin,
} from "@/lib/auth/require-role";
import { requireActorUserId } from "@/lib/auth/actor-id";
import { getNotificationActor } from "@/lib/notifications/actor";
import type { AppRole } from "@/lib/roles";
import { PAGE_SIZE } from "@/lib/employees/constants";
import { getActiveEmployeesForSelect } from "@/lib/actions/procurement";
import { formatProcurementBatchNumber } from "@/lib/procurement/batch-number";
import {
  isStandardKgPerBag,
  type ProcurementType,
  type ProductCondition,
} from "@/lib/procurement/constants";
import { toCleanPreStockProductType } from "@/lib/procurement/product-type";
import {
  calcBagsRemaining,
  calcProcessingOutputKg,
  calcSessionInputKg,
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
import type { ProcessingFormState } from "@/lib/processing/form-state";
import {
  EMPTY_PROCESSING_QUEUE_NOTIFICATIONS,
  type ProcessingQueueNotifications,
  canReceiveProcessingQueueNotifications,
} from "@/lib/processing/notifications";
import type {
  ProcessingBatchOption,
  ProcessingPendingSessionRow,
  ProcessingQueueRow,
  ProcessingSessionDetail,
  ProcessingSessionListRow,
  WasteRecordEntry,
} from "@/lib/processing/types";
import { canApproveProcessingStep } from "@/lib/permissions/matrix";
import { processingStepFromStatus } from "@/lib/permissions/approval";
import { createClient } from "@/lib/supabase/server";
import { nameFromMap, resolveUserDisplayNames } from "@/lib/users/resolve-user-names";

type BatchRow = {
  id: string;
  batch_number: string;
  product_type: string;
  product_condition: ProductCondition;
  procurement_type: ProcurementType;
  number_of_bags: number;
  kg_per_bag: number | null;
  extra_kg: number;
  total_kg: number;
  status: string;
  quality_decision: string;
  processing_closed: boolean;
  procurement_date: string;
  suppliers: { supplier_name: string } | { supplier_name: string }[] | null;
};

function parseNumber(value: FormDataEntryValue | null): number | undefined {
  const text = String(value ?? "").trim();
  if (!text) {
    return undefined;
  }

  const parsed = Number.parseFloat(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function supplierName(
  join: BatchRow["suppliers"],
): string {
  const supplier = Array.isArray(join) ? join[0] : join;
  return supplier?.supplier_name ?? "—";
}

async function sumBagsSentByBatchIds(
  batchIds: string[],
  excludeSessionId?: string,
): Promise<Map<string, number>> {
  const totals = new Map<string, number>();

  if (batchIds.length === 0) {
    return totals;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("processing_sessions")
    .select("source_batch_id, bags_sent, id")
    .in("source_batch_id", batchIds)
    .in("status", [...ACTIVE_PROCESSING_SESSION_STATUSES]);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of data ?? []) {
    if (row.id === excludeSessionId) {
      continue;
    }

    const batchId = row.source_batch_id as string;
    totals.set(batchId, (totals.get(batchId) ?? 0) + Number(row.bags_sent));
  }

  return totals;
}

async function sumBagsSentForBatch(
  batchId: string,
  excludeSessionId?: string,
): Promise<number> {
  const totals = await sumBagsSentByBatchIds([batchId], excludeSessionId);
  return totals.get(batchId) ?? 0;
}

async function getEligibleBatch(batchId: string): Promise<BatchRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("procurement_batches")
    .select(
      `
      id,
      batch_number,
      product_type,
      product_condition,
      procurement_type,
      number_of_bags,
      kg_per_bag,
      extra_kg,
      total_kg,
      status,
      quality_decision,
      processing_closed,
      procurement_date,
      suppliers!inner(supplier_name)
    `,
    )
    .eq("id", batchId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as BatchRow | null;
}

function isBatchEligibleForProcessing(batch: BatchRow): boolean {
  return (
    batch.status === "approved" &&
    batch.quality_decision === "processing" &&
    !batch.processing_closed
  );
}

export async function getProcessingQueue(): Promise<ProcessingQueueRow[]> {
  await requireProcessingRead();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("procurement_batches")
    .select(
      `
      id,
      batch_number,
      product_type,
      product_condition,
      number_of_bags,
      total_kg,
      procurement_date,
      suppliers!inner(supplier_name)
    `,
    )
    .eq("status", "approved")
    .eq("quality_decision", "processing")
    .eq("processing_closed", false)
    .order("batch_number", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows: ProcessingQueueRow[] = [];
  const batchIds = (data ?? []).map((batch) => batch.id);
  const bagsSentByBatch = await sumBagsSentByBatchIds(batchIds);

  for (const batch of data ?? []) {
    const bagsSent = bagsSentByBatch.get(batch.id) ?? 0;
    const bagsRemaining = calcBagsRemaining(
      Number(batch.number_of_bags),
      bagsSent,
    );

    if (bagsRemaining <= 0) {
      continue;
    }

    rows.push({
      id: batch.id,
      batch_number: batch.batch_number,
      product_type: batch.product_type,
      supplier_name: supplierName(batch.suppliers as BatchRow["suppliers"]),
      number_of_bags: Number(batch.number_of_bags),
      bags_remaining: bagsRemaining,
      total_kg: Number(batch.total_kg),
      procurement_date: batch.procurement_date,
      product_condition: batch.product_condition as ProcessingQueueRow["product_condition"],
    });
  }

  return rows;
}

export const getProcessingQueueNotifications = cache(
  async (): Promise<ProcessingQueueNotifications> => {
    const actor = await getNotificationActor();
    if (!actor) {
      return EMPTY_PROCESSING_QUEUE_NOTIFICATIONS;
    }

    const { userId, role } = actor;

    if (!canReceiveProcessingQueueNotifications(role)) {
      return EMPTY_PROCESSING_QUEUE_NOTIFICATIONS;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("procurement_batches")
      .select("id, number_of_bags")
      .eq("status", "approved")
      .eq("quality_decision", "processing")
      .eq("processing_closed", false);

    if (error) {
      return EMPTY_PROCESSING_QUEUE_NOTIFICATIONS;
    }

    let batchesWaiting = 0;
    let bagsRemaining = 0;
    const batchIds = (data ?? []).map((batch) => batch.id);
    const bagsSentByBatch = await sumBagsSentByBatchIds(batchIds);

    for (const batch of data ?? []) {
      const bagsSent = bagsSentByBatch.get(batch.id) ?? 0;
      const remaining = calcBagsRemaining(
        Number(batch.number_of_bags),
        bagsSent,
      );

      if (remaining <= 0) {
        continue;
      }

      batchesWaiting += 1;
      bagsRemaining += remaining;
    }

    let pendingApproval = 0;
    let submittedPending = 0;

    if (role === "super_admin" || role === "admin") {
      const { count, error: pendingError } = await supabase
        .from("processing_sessions")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_admin_approval");

      if (!pendingError && count != null) {
        pendingApproval = count;
      }
    } else {
      const reviewStatuses =
        role === "logistics_manager"
          ? ["pending_second_approval"]
          : ["pending_approval", "pending_second_approval"];

      const { count, error: submittedError } = await supabase
        .from("processing_sessions")
        .select("id", { count: "exact", head: true })
        .in("status", reviewStatuses)
        .neq("created_by", userId);

      if (!submittedError && count != null) {
        submittedPending = count;
      }
    }

    return {
      batchesWaiting,
      bagsRemaining,
      pendingApproval,
      submittedPending,
    };
  },
);

export async function getPendingProcessingSessions(): Promise<
  ProcessingPendingSessionRow[]
> {
  const { role } = await requireProcessingApprove();

  const statusFilter =
    role === "super_admin" || role === "admin"
      ? ["pending_admin_approval"]
      : role === "logistics_manager"
        ? ["pending_second_approval"]
        : ["pending_approval", "pending_second_approval"];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("processing_sessions")
    .select(
      `
      id,
      session_number,
      processing_date,
      bags_sent,
      input_kg,
      created_at,
      procurement_batches!inner(
        batch_number,
        product_type,
        suppliers!inner(supplier_name)
      )
    `,
    )
    .in("status", statusFilter)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const batchJoin = row.procurement_batches as
      | {
          batch_number: string;
          product_type: string;
          suppliers: BatchRow["suppliers"];
        }
      | {
          batch_number: string;
          product_type: string;
          suppliers: BatchRow["suppliers"];
        }[];

    const batch = Array.isArray(batchJoin) ? batchJoin[0] : batchJoin;

    return {
      id: row.id,
      session_number: row.session_number,
      batch_number: batch?.batch_number ?? "—",
      product_type: batch?.product_type ?? "—",
      supplier_name: supplierName(batch?.suppliers ?? null),
      processing_date: row.processing_date,
      bags_sent: Number(row.bags_sent),
      input_kg: Number(row.input_kg),
      created_at: row.created_at,
    };
  });
}

export async function getMyPendingProcessingSessions(): Promise<
  ProcessingPendingSessionRow[]
> {
  const { authUser } = await requireProcessingRead();

  if (!authUser) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("processing_sessions")
    .select(
      `
      id,
      session_number,
      processing_date,
      bags_sent,
      input_kg,
      created_at,
      procurement_batches!inner(
        batch_number,
        product_type,
        suppliers!inner(supplier_name)
      )
    `,
    )
    .eq("status", "pending_approval")
    .eq("created_by", authUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const batchJoin = row.procurement_batches as
      | {
          batch_number: string;
          product_type: string;
          suppliers: BatchRow["suppliers"];
        }
      | {
          batch_number: string;
          product_type: string;
          suppliers: BatchRow["suppliers"];
        }[];

    const batch = Array.isArray(batchJoin) ? batchJoin[0] : batchJoin;

    return {
      id: row.id,
      session_number: row.session_number,
      batch_number: batch?.batch_number ?? "—",
      product_type: batch?.product_type ?? "—",
      supplier_name: supplierName(batch?.suppliers ?? null),
      processing_date: row.processing_date,
      bags_sent: Number(row.bags_sent),
      input_kg: Number(row.input_kg),
      created_at: row.created_at,
    };
  });
}

export async function getProcessingSessionsList(
  page: number,
  query = "",
): Promise<{ rows: ProcessingSessionListRow[]; total: number }> {
  await requireProcessingRead();

  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let builder = supabase
    .from("processing_sessions")
    .select(
      `
      id,
      session_number,
      bags_sent,
      input_kg,
      output_kg,
      yield_pct,
      status,
      processing_date,
      procurement_batches!inner(batch_number, product_type)
    `,
      { count: "exact" },
    )
    .order("session_number", { ascending: false })
    .range(from, to);

  const trimmed = query.trim();
  if (trimmed) {
    const term = `%${trimmed}%`;
    builder = builder.or(
      `session_number.ilike.${term},procurement_batches.batch_number.ilike.${term}`,
    );
  }

  const { data, count, error } = await builder;

  if (error) {
    throw new Error(error.message);
  }

  const rows: ProcessingSessionListRow[] = (data ?? []).map((row) => {
    const batchJoin = row.procurement_batches as
      | { batch_number: string; product_type: string }
      | { batch_number: string; product_type: string }[];

    const batch = Array.isArray(batchJoin) ? batchJoin[0] : batchJoin;

    return {
      id: row.id,
      session_number: row.session_number,
      batch_number: formatProcurementBatchNumber(batch?.batch_number ?? "—"),
      product_type: batch?.product_type ?? "—",
      bags_sent: Number(row.bags_sent),
      input_kg: Number(row.input_kg),
      output_kg: row.output_kg != null ? Number(row.output_kg) : null,
      yield_pct: row.yield_pct != null ? Number(row.yield_pct) : null,
      status: row.status as ProcessingSessionStatus,
      processing_date: row.processing_date,
    };
  });

  return { rows, total: count ?? 0 };
}

export async function getProcessingBatchOption(
  batchId: string,
): Promise<ProcessingBatchOption | null> {
  await requireProcessingRead();

  const batch = await getEligibleBatch(batchId);
  if (!batch || !isBatchEligibleForProcessing(batch)) {
    return null;
  }

  const bagsSent = await sumBagsSentForBatch(batchId);

  return {
    id: batch.id,
    batch_number: formatProcurementBatchNumber(batch.batch_number),
    product_type: batch.product_type,
    bags_remaining: calcBagsRemaining(Number(batch.number_of_bags), bagsSent),
  };
}

export async function getProcessingSessionById(
  id: string,
): Promise<ProcessingSessionDetail | null> {
  await requireProcessingRead();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("processing_sessions")
    .select(
      `
      id,
      session_number,
      source_batch_id,
      processing_date,
      bags_sent,
      input_kg,
      output_kg,
      yield_pct,
      status,
      processed_by,
      notes,
      completed_at,
      approved_by,
      approved_at,
      rejected_by,
      rejected_at,
      created_at,
      procurement_batches!inner(
        batch_number,
        product_type,
        product_condition,
        procurement_type,
        number_of_bags,
        suppliers!inner(supplier_name)
      ),
      processing_outputs(
        bags_produced,
        kg_per_bag,
        extra_kg,
        total_kg
      ),
      waste_records(waste_type, number_of_bags, kg_per_bag, extra_kg, weight_kg)
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const batchJoin = data.procurement_batches as
    | {
        batch_number: string;
        product_type: string;
        product_condition: string;
        procurement_type: string;
        number_of_bags: number;
        suppliers: BatchRow["suppliers"];
      }
    | {
        batch_number: string;
        product_type: string;
        product_condition: string;
        procurement_type: string;
        number_of_bags: number;
        suppliers: BatchRow["suppliers"];
      }[];

  const batch = Array.isArray(batchJoin) ? batchJoin[0] : batchJoin;
  const bagsSentOnBatch = await sumBagsSentForBatch(data.source_batch_id);
  const batchBagsRemaining = calcBagsRemaining(
    Number(batch.number_of_bags),
    bagsSentOnBatch,
  );

  const outputJoin = data.processing_outputs as
    | {
        bags_produced: number;
        kg_per_bag: number | null;
        extra_kg: number;
        total_kg: number;
      }
    | {
        bags_produced: number;
        kg_per_bag: number | null;
        extra_kg: number;
        total_kg: number;
      }[]
    | null;

  const outputRow = Array.isArray(outputJoin) ? outputJoin[0] : outputJoin;

  const wasteRows = (data.waste_records ?? []) as {
    waste_type: WasteType;
    number_of_bags: number;
    kg_per_bag: number | null;
    extra_kg: number;
    weight_kg: number;
  }[];

  const waste = Object.fromEntries(
    WASTE_TYPES.map((type) => [
      type,
      { number_of_bags: 0, kg_per_bag: null, extra_kg: 0, weight_kg: 0 },
    ]),
  ) as Record<WasteType, WasteRecordEntry>;

  for (const record of wasteRows) {
    waste[record.waste_type] = {
      number_of_bags: Number(record.number_of_bags ?? 0),
      kg_per_bag:
        record.kg_per_bag != null ? Number(record.kg_per_bag) : null,
      extra_kg: Number(record.extra_kg ?? 0),
      weight_kg: Number(record.weight_kg ?? 0),
    };
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
    id: data.id,
    session_number: data.session_number,
    source_batch_id: data.source_batch_id,
    batch_number: formatProcurementBatchNumber(batch.batch_number),
    product_type: batch.product_type,
    product_condition:
      batch.product_condition as ProcessingSessionDetail["product_condition"],
    procurement_type:
      batch.procurement_type as ProcessingSessionDetail["procurement_type"],
    supplier_name: supplierName(batch.suppliers),
    batch_total_bags: Number(batch.number_of_bags),
    batch_bags_remaining: batchBagsRemaining,
    processing_date: data.processing_date,
    bags_sent: Number(data.bags_sent),
    input_kg: Number(data.input_kg),
    output_kg: data.output_kg != null ? Number(data.output_kg) : null,
    yield_pct: data.yield_pct != null ? Number(data.yield_pct) : null,
    status: data.status as ProcessingSessionStatus,
    processed_by: data.processed_by,
    processed_by_label: processedByLabel,
    notes: data.notes,
    completed_at: data.completed_at,
    approved_by: data.approved_by,
    approved_at: data.approved_at,
    approved_by_name: nameFromMap(nameByUserId, data.approved_by),
    rejected_by: data.rejected_by,
    rejected_at: data.rejected_at,
    rejected_by_name: nameFromMap(nameByUserId, data.rejected_by),
    created_at: data.created_at,
    output: outputRow
      ? {
          bags_produced: Number(outputRow.bags_produced),
          kg_per_bag:
            outputRow.kg_per_bag != null ? Number(outputRow.kg_per_bag) : null,
          extra_kg: Number(outputRow.extra_kg),
          total_kg: Number(outputRow.total_kg),
        }
      : null,
    waste,
  };
}

function parseWaste(formData: FormData): Record<WasteType, WasteRecordEntry> {
  const waste = {} as Record<WasteType, WasteRecordEntry>;

  for (const type of WASTE_TYPES) {
    const numberOfBags =
      Number.parseInt(String(formData.get(`waste_${type}_bags`) ?? ""), 10) ||
      0;
    const kgPerBagRaw = parseNumber(
      formData.get(`waste_${type}_kg_per_bag`),
    );
    const extraKg = parseNumber(formData.get(`waste_${type}_extra_kg`)) ?? 0;
    const kgPerBag =
      numberOfBags > 0
        ? (kgPerBagRaw ?? DEFAULT_WASTE_KG_PER_BAG)
        : (kgPerBagRaw ?? null);

    waste[type] = {
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

  return waste;
}

function validateWaste(waste: Record<WasteType, WasteRecordEntry>): string | null {
  for (const type of WASTE_TYPES) {
    const entry = waste[type];

    if (entry.number_of_bags <= 0 && entry.extra_kg <= 0) {
      continue;
    }

    if (entry.extra_kg < 0) {
      return `${WASTE_TYPE_LABELS[type]} extra kg cannot be negative.`;
    }

    if (entry.number_of_bags > 0) {
      if (entry.kg_per_bag == null || entry.kg_per_bag <= 0) {
        return `${WASTE_TYPE_LABELS[type]} requires a package size when bags are recorded.`;
      }

      if (!isStandardWasteKgPerBag(entry.kg_per_bag)) {
        return "Waste package size must be 15, 20, 25, or 30 kg per bag.";
      }
    }
  }

  return null;
}

function parseOutput(formData: FormData) {
  const kgPerBag = parseNumber(formData.get("output_kg_per_bag"));
  return {
    bags_produced:
      Number.parseInt(String(formData.get("output_bags_produced") ?? ""), 10) ||
      0,
    kg_per_bag: kgPerBag ?? null,
    extra_kg: parseNumber(formData.get("output_extra_kg")) ?? 0,
  };
}

function validateOutput(output: ReturnType<typeof parseOutput>): string | null {
  if (output.bags_produced < 0) {
    return "Output bags cannot be negative.";
  }

  if (
    output.kg_per_bag != null &&
    output.kg_per_bag > 0 &&
    !isStandardKgPerBag(output.kg_per_bag)
  ) {
    return "Output package size must be 25 or 20 kg per bag.";
  }

  if (output.bags_produced > 0) {
    const hasKgPerBag =
      output.kg_per_bag != null && output.kg_per_bag > 0;
    if (!hasKgPerBag && output.extra_kg <= 0) {
      return "Enter package size (25 or 20 kg per bag) or extra KG when reporting bags produced.";
    }
  }

  const totalKg = calcProcessingOutputKg(output);
  if (totalKg <= 0) {
    return "Output total KG must be greater than zero to complete processing.";
  }

  return null;
}

export async function startProcessingSession(
  _prev: ProcessingFormState,
  formData: FormData,
): Promise<ProcessingFormState> {
  const { authUser } = await requireProcessingWrite();
  if (!authUser) {
    return { error: "You must be signed in to start processing." };
  }

  const batchId = String(formData.get("source_batch_id") ?? "").trim();
  const processingDate = String(formData.get("processing_date") ?? "").trim();
  const bagsSent = Number.parseInt(
    String(formData.get("bags_sent") ?? ""),
    10,
  );
  const processedBy = String(formData.get("processed_by") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!batchId) {
    return { error: "Select a procurement batch." };
  }

  if (!processingDate) {
    return { error: "Processing date is required." };
  }

  if (!Number.isFinite(bagsSent) || bagsSent <= 0) {
    return { error: "Bags sent must be greater than zero." };
  }

  const batch = await getEligibleBatch(batchId);
  if (!batch || !isBatchEligibleForProcessing(batch)) {
    return { error: "This batch is not available for processing." };
  }

  const bagsAlreadySent = await sumBagsSentForBatch(batchId);
  const bagsRemaining = calcBagsRemaining(
    Number(batch.number_of_bags),
    bagsAlreadySent,
  );

  if (bagsSent > bagsRemaining) {
    return {
      error: `Only ${bagsRemaining.toLocaleString()} bag(s) remaining on this batch.`,
    };
  }

  const inputKg = calcSessionInputKg(
    {
      procurement_type: batch.procurement_type,
      product_condition: batch.product_condition,
      number_of_bags: Number(batch.number_of_bags),
      kg_per_bag: batch.kg_per_bag != null ? Number(batch.kg_per_bag) : null,
      extra_kg: Number(batch.extra_kg),
      total_kg: Number(batch.total_kg),
    },
    bagsSent,
  );

  if (inputKg <= 0) {
    return { error: "Could not calculate input KG for this session." };
  }

  const supabase = await createClient();
  const { data: sessionNumber, error: numberError } = await supabase.rpc(
    "generate_processing_session_number",
  );

  if (numberError) {
    return {
      error: numberError.message.includes("Could not find the function")
        ? "Processing tables are not set up yet. Run migration 00009 in Supabase."
        : numberError.message,
    };
  }

  const { data: inserted, error } = await supabase
    .from("processing_sessions")
    .insert({
      session_number: sessionNumber as string,
      source_batch_id: batchId,
      processing_date: processingDate,
      bags_sent: bagsSent,
      input_kg: inputKg,
      processed_by: processedBy,
      created_by: authUser.id,
      notes,
      status: "pending_approval" as ProcessingSessionStatus,
    })
    .select("id")
    .single();

  if (error) {
    if (
      error.message.includes("pending_approval") &&
      error.message.includes("enum")
    ) {
      return {
        error:
          "Database migration missing. In Supabase SQL Editor, run 00013_processing_session_approval.sql, then 00014_processing_session_approval_apply.sql (two separate queries).",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/processing");
  revalidatePath("/dashboard", "layout");
  return { success: true, sessionId: inserted.id };
}

async function upsertSessionOutputAndWaste(
  sessionId: string,
  output: ReturnType<typeof parseOutput>,
  waste: Record<WasteType, WasteRecordEntry>,
): Promise<string | null> {
  const totalKg = calcProcessingOutputKg(output);
  const supabase = await createClient();

  const { data: existingOutput } = await supabase
    .from("processing_outputs")
    .select("id")
    .eq("processing_session_id", sessionId)
    .maybeSingle();

  if (existingOutput) {
    const { error } = await supabase
      .from("processing_outputs")
      .update({
        bags_produced: output.bags_produced,
        kg_per_bag: output.kg_per_bag ?? null,
        extra_kg: output.extra_kg,
        total_kg: totalKg,
      })
      .eq("processing_session_id", sessionId);

    if (error) {
      return error.message;
    }
  } else {
    const { error } = await supabase.from("processing_outputs").insert({
      processing_session_id: sessionId,
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
    const entry = waste[type];

    if (entry.weight_kg <= 0) {
      await supabase
        .from("waste_records")
        .delete()
        .eq("processing_session_id", sessionId)
        .eq("waste_type", type);
      continue;
    }

    const { error } = await supabase.from("waste_records").upsert(
      {
        processing_session_id: sessionId,
        waste_type: type,
        number_of_bags: entry.number_of_bags,
        kg_per_bag: entry.kg_per_bag,
        extra_kg: entry.extra_kg,
        weight_kg: entry.weight_kg,
        date_recorded: new Date().toISOString().slice(0, 10),
      },
      { onConflict: "processing_session_id,waste_type" },
    );

    if (error) {
      return error.message;
    }
  }

  return null;
}

export async function updateProcessingSession(
  sessionId: string,
  _prev: ProcessingFormState,
  formData: FormData,
): Promise<ProcessingFormState> {
  await requireProcessingWrite();

  const supabase = await createClient();
  const { data: session, error: sessionError } = await supabase
    .from("processing_sessions")
    .select("id, status, input_kg, source_batch_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError) {
    return { error: sessionError.message };
  }

  if (!session) {
    return { error: "Processing session not found." };
  }

  if (session.status !== "in_progress") {
    if (session.status === "pending_approval") {
      return { error: "This session is awaiting admin approval." };
    }
    if (session.status === "rejected") {
      return { error: "This processing request was rejected." };
    }
    return { error: "Completed sessions cannot be edited." };
  }

  const processingDate = String(formData.get("processing_date") ?? "").trim();
  const processedBy = String(formData.get("processed_by") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const output = parseOutput(formData);
  const waste = parseWaste(formData);
  const outputError = validateOutput(output);
  const wasteError = validateWaste(waste);

  if (outputError) {
    return { error: outputError };
  }

  if (wasteError) {
    return { error: wasteError };
  }

  if (!processingDate) {
    return { error: "Processing date is required." };
  }

  const saveError = await upsertSessionOutputAndWaste(sessionId, output, waste);
  if (saveError) {
    return { error: saveError };
  }

  const { error } = await supabase
    .from("processing_sessions")
    .update({
      processing_date: processingDate,
      processed_by: processedBy,
      notes,
    })
    .eq("id", sessionId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/processing");
  revalidatePath(`/processing/${sessionId}`);
  return { success: true };
}

export async function completeProcessingSession(
  sessionId: string,
  _prev: ProcessingFormState,
  formData: FormData,
): Promise<ProcessingFormState> {
  await requireProcessingWrite();

  const output = parseOutput(formData);
  const waste = parseWaste(formData);
  const outputError = validateOutput(output);
  const wasteError = validateWaste(waste);

  if (outputError) {
    return { error: outputError };
  }

  if (wasteError) {
    return { error: wasteError };
  }

  const supabase = await createClient();
  const { data: session, error: sessionError } = await supabase
    .from("processing_sessions")
    .select(
      `
      id,
      status,
      input_kg,
      source_batch_id,
      procurement_batches!inner(
        number_of_bags,
        product_type,
        processing_closed
      )
    `,
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError) {
    return { error: sessionError.message };
  }

  if (!session) {
    return { error: "Processing session not found." };
  }

  if (session.status !== "in_progress") {
    if (session.status === "pending_approval") {
      return { error: "Approve this session before completing processing." };
    }
    if (session.status === "rejected") {
      return { error: "This processing request was rejected." };
    }
    return { error: "This session is already completed." };
  }

  const saveError = await upsertSessionOutputAndWaste(sessionId, output, waste);
  if (saveError) {
    return { error: saveError };
  }

  const totalOutputKg = calcProcessingOutputKg(output);
  const yieldPct = calcYieldPct(Number(session.input_kg), totalOutputKg);

  const batchJoin = session.procurement_batches as
    | { number_of_bags: number; product_type: string; processing_closed: boolean }
    | { number_of_bags: number; product_type: string; processing_closed: boolean }[];

  const batch = Array.isArray(batchJoin) ? batchJoin[0] : batchJoin;

  const { data: preStockNumber, error: preStockNumberError } =
    await supabase.rpc("generate_pre_stock_number");

  if (preStockNumberError) {
    return { error: preStockNumberError.message };
  }

  const preStockProductType = toCleanPreStockProductType(batch.product_type);

  const { error: preStockError } = await supabase.from("pre_stock").insert({
    pre_stock_number: preStockNumber as string,
    source_type: "processing",
    source_id: sessionId,
    product_type: preStockProductType,
    bags: output.bags_produced,
    bags_received: output.bags_produced,
    total_kg: totalOutputKg,
    total_kg_received: totalOutputKg,
    date_received: new Date().toISOString().slice(0, 10),
    status: "available",
  });

  if (preStockError) {
    if (preStockError.message.includes("pre_stock_total_kg_check")) {
      return {
        error:
          "Pre-stock weight must be greater than zero. Enter package size (25 or 20 kg per bag) or extra KG for the output.",
      };
    }
    return { error: preStockError.message };
  }

  const { error: completeError } = await supabase
    .from("processing_sessions")
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
      .from("pre_stock")
      .delete()
      .eq("source_type", "processing")
      .eq("source_id", sessionId);
    return { error: completeError.message };
  }

  const bagsSentTotal = await sumBagsSentForBatch(session.source_batch_id);
  const bagsRemaining = calcBagsRemaining(
    Number(batch.number_of_bags),
    bagsSentTotal,
  );

  if (bagsRemaining <= 0) {
    await supabase
      .from("procurement_batches")
      .update({ processing_closed: true })
      .eq("id", session.source_batch_id);
  }

  revalidatePath("/processing");
  revalidatePath(`/processing/${sessionId}`);
  revalidatePath("/inventory");
  revalidatePath("/inventory/pre-stock");
  revalidatePath("/expenses");
  revalidatePath("/expenses/operational");
  revalidatePath("/dashboard", "layout");
  return { success: true };
}

export async function approveProcessingSession(sessionId: string) {
  const authSession = await requireProcessingApprove();
  const actorUserId = requireActorUserId(authSession);
  const { role } = authSession;

  const supabase = await createClient();
  const { data: session, error: fetchError } = await supabase
    .from("processing_sessions")
    .select(
      "id, status, created_by, first_approved_by, second_approved_by",
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!session) {
    throw new Error("Processing session not found.");
  }

  const status = session.status as ProcessingSessionStatus;

  if (status === "rejected" || status === "in_progress" || status === "completed") {
    throw new Error("This session is not awaiting approval.");
  }

  const step = processingStepFromStatus(status);
  if (!step) {
    throw new Error("This session is not awaiting approval.");
  }

  if (!canApproveProcessingStep(role, step)) {
    throw new Error("You are not allowed to approve at this step.");
  }

  if (step === "first") {
    if (session.created_by === actorUserId) {
      throw new Error("You cannot approve your own submission.");
    }

    const { error } = await supabase
      .from("processing_sessions")
      .update({
        status: "pending_second_approval" as ProcessingSessionStatus,
        first_approved_by: actorUserId,
        first_approved_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .eq("status", status);

    if (error) {
      throw new Error(error.message);
    }
  } else if (step === "second") {
    if (
      session.created_by === actorUserId ||
      session.first_approved_by === actorUserId
    ) {
      throw new Error("A different reviewer must complete the second approval.");
    }

    const { error } = await supabase
      .from("processing_sessions")
      .update({
        status: "pending_admin_approval" as ProcessingSessionStatus,
        second_approved_by: actorUserId,
        second_approved_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .eq("status", status);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase
      .from("processing_sessions")
      .update({
        status: "in_progress" as ProcessingSessionStatus,
        approved_by: actorUserId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .eq("status", status);

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/processing");
  revalidatePath(`/processing/${sessionId}`);
  revalidatePath("/dashboard", "layout");
}

export async function rejectProcessingSession(sessionId: string) {
  const authSession = await requireProcessingApprove();
  const actorUserId = requireActorUserId(authSession);

  const supabase = await createClient();
  const { data: session, error: fetchError } = await supabase
    .from("processing_sessions")
    .select("id, status")
    .eq("id", sessionId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!session) {
    throw new Error("Processing session not found.");
  }

  const status = session.status as ProcessingSessionStatus;
  if (
    status !== "pending_approval" &&
    status !== "pending_second_approval" &&
    status !== "pending_admin_approval"
  ) {
    throw new Error("Only pending sessions can be rejected.");
  }

  const { error } = await supabase
    .from("processing_sessions")
    .update({
      status: "rejected" as ProcessingSessionStatus,
      rejected_by: actorUserId,
      rejected_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("status", status);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/processing");
  revalidatePath(`/processing/${sessionId}`);
  revalidatePath("/dashboard", "layout");
}

export async function approveProcessingSessionAction(sessionId: string) {
  await approveProcessingSession(sessionId);
}

export async function rejectProcessingSessionAction(sessionId: string) {
  await rejectProcessingSession(sessionId);
}

export async function unlockProcessingSession(
  sessionId: string,
): Promise<{ error?: string }> {
  await requireSuperAdmin();

  const supabase = await createClient();
  const { data: session, error: fetchError } = await supabase
    .from("processing_sessions")
    .select("id, status, source_batch_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!session) {
    return { error: "Processing session not found." };
  }

  if (session.status !== "completed") {
    return { error: "Only completed sessions can be unlocked." };
  }

  const { data: preStock, error: preStockFetchError } = await supabase
    .from("pre_stock")
    .select("id")
    .eq("source_type", "processing")
    .eq("source_id", sessionId)
    .maybeSingle();

  if (preStockFetchError) {
    return { error: preStockFetchError.message };
  }

  if (preStock) {
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
  }

  const { error: preStockDeleteError } = await supabase
    .from("pre_stock")
    .delete()
    .eq("source_type", "processing")
    .eq("source_id", sessionId);

  if (preStockDeleteError) {
    return { error: preStockDeleteError.message };
  }

  const { data: updated, error } = await supabase
    .from("processing_sessions")
    .update({
      status: "in_progress",
      completed_at: null,
      output_kg: null,
      yield_pct: null,
    })
    .eq("id", sessionId)
    .eq("status", "completed")
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!updated) {
    return { error: "Session could not be unlocked." };
  }

  await supabase
    .from("procurement_batches")
    .update({ processing_closed: false })
    .eq("id", session.source_batch_id)
    .eq("processing_closed", true);

  revalidatePath("/processing");
  revalidatePath(`/processing/${sessionId}`);
  revalidatePath("/inventory");
  revalidatePath("/inventory/pre-stock");
  return {};
}
