"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";

import { requireActorUserId } from "@/lib/auth/actor-id";
import {
  requireExpenseApprove,
  requireExpensePaidNow,
  requireExpenseRead,
  requireExpenseWrite,
} from "@/lib/auth/require-role";
import { PAGE_SIZE } from "@/lib/employees/constants";
import { createMemoryTtlCache } from "@/lib/cache/memory-ttl-cache";
import {
  DAILY_EXPENSE_CATEGORIES,
  EXPENSE_IN_FLIGHT_STATUSES,
  EXPENSE_PAYMENT_METHODS,
  OPERATIONAL_EXPENSE_TYPES,
  type DailyExpenseCategory,
  type ExpensePaymentMethod,
  type ExpenseRecordStatus,
  type OperationalExpenseType,
} from "@/lib/expenses/constants";
import {
  calcOperationalTotal,
  OPERATIONAL_EXPENSE_LINK_RULES,
} from "@/lib/expenses/link-rules";
import {
  EMPTY_EXPENSE_NOTIFICATIONS,
  EMPTY_OPERATIONAL_EXPENSE_NOTIFICATIONS,
  type ExpenseNotifications,
  canReceiveExpenseNotifications,
  type OperationalExpenseNotificationCounts,
  emptyOperationalPendingByType,
  type OperationalExpensePendingByType,
} from "@/lib/expenses/notifications";
import type {
  DailyExpenseListRow,
  ExpenseLinkOption,
  InventoryExpenseLinkOption,
  OperationalExpenseListRow,
  PettyCashSummary,
  PettyCashTopUpRow,
  PreStockExpenseLinkOption,
  ProcurementExpenseLinkOption,
  ProcessingExpenseLinkOption,
} from "@/lib/expenses/types";
import { getNotificationActor } from "@/lib/notifications/actor";
import { getShipmentsForExpenseLink } from "@/lib/actions/shipments";
import type { AppRole } from "@/lib/roles";
import {
  accountsCanConfirmExpensePayment,
  canApproveExpense,
} from "@/lib/expenses/permissions";
import { createClient } from "@/lib/supabase/server";
import { nameFromMap, resolveUserDisplayNames } from "@/lib/users/resolve-user-names";
import { resolveUserRoles, roleFromMap } from "@/lib/users/resolve-user-roles";

type DailyExpenseRow = {
  id: string;
  expense_date: string;
  expense_category: DailyExpenseCategory;
  description: string;
  amount: number;
  payment_method: ExpensePaymentMethod;
  status: ExpenseRecordStatus;
  entered_by: string | null;
  approved_by: string | null;
  payment_made_by: string | null;
  notes: string | null;
};

type OperationalExpenseRow = {
  id: string;
  expense_type: OperationalExpenseType;
  expense_date: string;
  description: string | null;
  bags: number;
  rate_per_bag: number;
  total_amount: number;
  payment_method: ExpensePaymentMethod;
  status: ExpenseRecordStatus;
  paid_by: string | null;
  approved_by: string | null;
  payment_made_by: string | null;
  notes: string | null;
  processing_session_id: string | null;
  inventory_batch_id: string | null;
  procurement_batch_id: string | null;
  pre_stock_id: string | null;
  shipment_id: string | null;
  processing_sessions:
    | { session_number: string }
    | { session_number: string }[]
    | null;
  inventory_batches:
    | { inventory_number: string }
    | { inventory_number: string }[]
    | null;
  procurement_batches:
    | { batch_number: string }
    | { batch_number: string }[]
    | null;
  pre_stock:
    | { pre_stock_number: string }
    | { pre_stock_number: string }[]
    | null;
  shipments:
    | { shipment_number: string }
    | { shipment_number: string }[]
    | null;
};

const DAILY_EXPENSE_SELECT = `
  id,
  expense_date,
  expense_category,
  description,
  amount,
  payment_method,
  status,
  entered_by,
  approved_by,
  notes
`;

const OPERATIONAL_EXPENSE_SELECT = `
  id,
  expense_type,
  expense_date,
  description,
  bags,
  rate_per_bag,
  total_amount,
  payment_method,
  status,
  paid_by,
  approved_by,
  notes,
  processing_session_id,
  inventory_batch_id,
  procurement_batch_id,
  pre_stock_id,
  shipment_id,
  processing_sessions(session_number),
  inventory_batches(inventory_number),
  procurement_batches(batch_number),
  pre_stock(pre_stock_number),
  shipments(shipment_number)
`;

function joinOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type ExpenseSupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function countUnclaimedRows(
  supabase: ExpenseSupabaseClient,
  table: string,
  excludedIds: Set<string>,
  filters: Record<string, string> = {},
): Promise<number> {
  const buildBase = () => {
    let query = supabase.from(table).select("id", { count: "exact", head: true });
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }
    return query;
  };

  const [totalResult, overlapResult] = await Promise.all([
    buildBase(),
    excludedIds.size > 0
      ? buildBase().in("id", [...excludedIds])
      : Promise.resolve({ count: 0, error: null }),
  ]);

  if (totalResult.error) {
    throw new Error(totalResult.error.message);
  }
  if (overlapResult.error) {
    throw new Error(overlapResult.error.message);
  }

  return Math.max(0, (totalResult.count ?? 0) - (overlapResult.count ?? 0));
}

async function validateGradingOperationalExpense(
  supabase: Awaited<ReturnType<typeof createClient>>,
  inventoryBatchId: string,
  bags: number,
): Promise<{ error?: string }> {
  const { data: batch, error: batchError } = await supabase
    .from("inventory_batches")
    .select("id, bags")
    .eq("id", inventoryBatchId)
    .maybeSingle();

  if (batchError) {
    return { error: batchError.message };
  }

  if (!batch) {
    return { error: "Inventory batch not found." };
  }

  if (bags !== batch.bags) {
    return {
      error: `Bag count must match inventory stock (${batch.bags.toLocaleString()}).`,
    };
  }

  const { count, error: duplicateError } = await supabase
    .from("operational_expenses")
    .select("id", { count: "exact", head: true })
    .eq("expense_type", "grading")
    .eq("inventory_batch_id", inventoryBatchId)
    .in("status", [...EXPENSE_IN_FLIGHT_STATUSES]);

  if (duplicateError) {
    return { error: duplicateError.message };
  }

  if ((count ?? 0) > 0) {
    return {
      error: "A grading expense has already been submitted for this inventory batch.",
    };
  }

  return {};
}

async function validateTruckOffloadingOperationalExpense(
  supabase: Awaited<ReturnType<typeof createClient>>,
  procurementBatchId: string,
  bags: number,
): Promise<{ error?: string }> {
  const { data: batch, error: batchError } = await supabase
    .from("procurement_batches")
    .select("id, number_of_bags, procurement_type, status")
    .eq("id", procurementBatchId)
    .maybeSingle();

  if (batchError) {
    return { error: batchError.message };
  }

  if (!batch) {
    return { error: "Procurement batch not found." };
  }

  if (batch.procurement_type !== "off_site") {
    return {
      error: "Truck offloading must link to an off-site procurement batch.",
    };
  }

  if (batch.status !== "approved") {
    return {
      error: "Truck offloading can only be recorded against an approved batch.",
    };
  }

  if (bags !== batch.number_of_bags) {
    return {
      error: `Bag count must match batch bags (${batch.number_of_bags.toLocaleString()}).`,
    };
  }

  const { count, error: duplicateError } = await supabase
    .from("operational_expenses")
    .select("id", { count: "exact", head: true })
    .eq("expense_type", "truck_offloading")
    .eq("procurement_batch_id", procurementBatchId)
    .in("status", [...EXPENSE_IN_FLIGHT_STATUSES]);

  if (duplicateError) {
    return { error: duplicateError.message };
  }

  if ((count ?? 0) > 0) {
    return {
      error: "A truck offloading expense has already been submitted for this procurement batch.",
    };
  }

  return {};
}

async function validateFieldTransferInOperationalExpense(
  supabase: Awaited<ReturnType<typeof createClient>>,
  preStockId: string,
  bags: number,
): Promise<{ error?: string }> {
  const { data: preStock, error: preStockError } = await supabase
    .from("pre_stock")
    .select("id, bags_received")
    .eq("id", preStockId)
    .maybeSingle();

  if (preStockError) {
    return { error: preStockError.message };
  }

  if (!preStock) {
    return { error: "Pre-stock record not found." };
  }

  if (bags !== preStock.bags_received) {
    return {
      error: `Bag count must match pre-stock received (${preStock.bags_received.toLocaleString()}).`,
    };
  }

  const { count, error: duplicateError } = await supabase
    .from("operational_expenses")
    .select("id", { count: "exact", head: true })
    .eq("expense_type", "field_transfer_in")
    .eq("pre_stock_id", preStockId)
    .in("status", [...EXPENSE_IN_FLIGHT_STATUSES]);

  if (duplicateError) {
    return { error: duplicateError.message };
  }

  if ((count ?? 0) > 0) {
    return {
      error: "A field transfer in expense has already been submitted for this pre-stock record.",
    };
  }

  return {};
}

async function validateProcessingSessionOperationalExpense(
  supabase: Awaited<ReturnType<typeof createClient>>,
  expenseType: "cleaning" | "field_transfer_out",
  processingSessionId: string,
  bags: number,
): Promise<{ error?: string }> {
  const expenseLabel =
    expenseType === "cleaning" ? "Cleaning" : "Field transfer out";

  const { data: session, error: sessionError } = await supabase
    .from("processing_sessions")
    .select("id, bags_sent, status")
    .eq("id", processingSessionId)
    .maybeSingle();

  if (sessionError) {
    return { error: sessionError.message };
  }

  if (!session) {
    return { error: "Processing session not found." };
  }

  if (session.status !== "completed") {
    return {
      error: `${expenseLabel} can only be recorded against a completed processing session.`,
    };
  }

  if (bags !== session.bags_sent) {
    return {
      error: `Bag count must match bags sent (${session.bags_sent.toLocaleString()}).`,
    };
  }

  const { count, error: duplicateError } = await supabase
    .from("operational_expenses")
    .select("id", { count: "exact", head: true })
    .eq("expense_type", expenseType)
    .eq("processing_session_id", processingSessionId)
    .in("status", [...EXPENSE_IN_FLIGHT_STATUSES]);

  if (duplicateError) {
    return { error: duplicateError.message };
  }

  if ((count ?? 0) > 0) {
    return {
      error: `A ${expenseLabel.toLowerCase()} expense has already been submitted for this processing session.`,
    };
  }

  return {};
}

async function validateCleaningOperationalExpense(
  supabase: Awaited<ReturnType<typeof createClient>>,
  processingSessionId: string,
  bags: number,
): Promise<{ error?: string }> {
  return validateProcessingSessionOperationalExpense(
    supabase,
    "cleaning",
    processingSessionId,
    bags,
  );
}

async function validateFieldTransferOutOperationalExpense(
  supabase: Awaited<ReturnType<typeof createClient>>,
  processingSessionId: string,
  bags: number,
): Promise<{ error?: string }> {
  return validateProcessingSessionOperationalExpense(
    supabase,
    "field_transfer_out",
    processingSessionId,
    bags,
  );
}

async function validateWarehouseLoadingOperationalExpense(
  supabase: Awaited<ReturnType<typeof createClient>>,
  shipmentId: string,
  bags: number,
): Promise<{ error?: string }> {
  const { data: shipment, error: shipmentError } = await supabase
    .from("shipments")
    .select("id, status")
    .eq("id", shipmentId)
    .maybeSingle();

  if (shipmentError) {
    return { error: shipmentError.message };
  }

  if (!shipment) {
    return { error: "Shipment not found." };
  }

  if (!["loaded", "in_transit"].includes(shipment.status)) {
    return {
      error: "Warehouse loading can only be recorded for loaded or in-transit shipments.",
    };
  }

  const { data: lines, error: linesError } = await supabase
    .from("shipment_inventory")
    .select("bags")
    .eq("shipment_id", shipmentId);

  if (linesError) {
    return { error: linesError.message };
  }

  const expectedBags = (lines ?? []).reduce(
    (sum, line) => sum + Number(line.bags ?? 0),
    0,
  );

  if (bags !== expectedBags) {
    return {
      error: `Bag count must match shipment inventory (${expectedBags.toLocaleString()}).`,
    };
  }

  const { count, error: duplicateError } = await supabase
    .from("operational_expenses")
    .select("id", { count: "exact", head: true })
    .eq("expense_type", "warehouse_loading")
    .eq("shipment_id", shipmentId)
    .in("status", [...EXPENSE_IN_FLIGHT_STATUSES]);

  if (duplicateError) {
    return { error: duplicateError.message };
  }

  if ((count ?? 0) > 0) {
    return {
      error: "A warehouse loading expense has already been submitted for this shipment.",
    };
  }

  return {};
}

function resolveOperationalLink(
  row: OperationalExpenseRow,
): { label: string; href: string | null } {
  if (row.expense_type === "miscellaneous") {
    const description = row.description?.trim();
    return {
      label: description || "—",
      href: null,
    };
  }

  if (row.processing_session_id) {
    const session = joinOne(row.processing_sessions);
    return {
      label: session?.session_number ?? "Processing session",
      href: `/processing/${row.processing_session_id}`,
    };
  }

  if (row.inventory_batch_id) {
    const batch = joinOne(row.inventory_batches);
    return {
      label: batch?.inventory_number ?? "Inventory batch",
      href: `/inventory/export/${row.inventory_batch_id}`,
    };
  }

  if (row.procurement_batch_id) {
    const batch = joinOne(row.procurement_batches);
    return {
      label: batch?.batch_number ?? "Procurement batch",
      href: `/procurement/${row.procurement_batch_id}`,
    };
  }

  if (row.pre_stock_id) {
    const preStock = joinOne(row.pre_stock);
    return {
      label: preStock?.pre_stock_number ?? "Pre-stock",
      href: `/inventory/pre-stock/${row.pre_stock_id}`,
    };
  }

  if (row.shipment_id) {
    const shipment = joinOne(row.shipments);
    return {
      label: shipment?.shipment_number ?? "Shipment",
      href: `/logistics/shipments/${row.shipment_id}`,
    };
  }

  return { label: "—", href: null };
}

async function mapDailyExpenseRows(
  rows: DailyExpenseRow[],
): Promise<DailyExpenseListRow[]> {
  const userIds = rows.flatMap((row) => [row.entered_by, row.approved_by]);
  const [nameByUserId, roleByUserId] = await Promise.all([
    resolveUserDisplayNames(userIds),
    resolveUserRoles(userIds),
  ]);

  return rows.map((row) => ({
    id: row.id,
    expense_date: row.expense_date,
    expense_category: row.expense_category,
    description: row.description,
    amount: Number(row.amount),
    payment_method: row.payment_method,
    status: row.status,
    entered_by: row.entered_by,
    entered_by_name: nameFromMap(nameByUserId, row.entered_by),
    entered_by_role: roleFromMap(roleByUserId, row.entered_by),
    approved_by: row.approved_by,
    approved_by_name: nameFromMap(nameByUserId, row.approved_by),
    notes: row.notes,
  }));
}

async function mapOperationalExpenseRows(
  rows: OperationalExpenseRow[],
): Promise<OperationalExpenseListRow[]> {
  const userIds = rows.flatMap((row) => [row.paid_by, row.approved_by]);
  const [nameByUserId, roleByUserId] = await Promise.all([
    resolveUserDisplayNames(userIds),
    resolveUserRoles(userIds),
  ]);

  return rows.map((row) => {
    const link = resolveOperationalLink(row);

    return {
      id: row.id,
      expense_type: row.expense_type,
      expense_date: row.expense_date,
      description: row.description,
      bags: row.bags,
      rate_per_bag: Number(row.rate_per_bag),
      total_amount: Number(row.total_amount),
      payment_method: row.payment_method,
      status: row.status,
      paid_by: row.paid_by,
      paid_by_name: nameFromMap(nameByUserId, row.paid_by),
      paid_by_role: roleFromMap(roleByUserId, row.paid_by),
      approved_by: row.approved_by,
      approved_by_name: nameFromMap(nameByUserId, row.approved_by),
      link_label: link.label,
      link_href: link.href,
      notes: row.notes,
    };
  });
}

type PettyCashTopUpDbRow = {
  id: string;
  amount_added: number;
  date_added: string;
  added_by: string | null;
  notes: string | null;
};

async function mapPettyCashTopUpRows(
  rows: PettyCashTopUpDbRow[],
): Promise<PettyCashTopUpRow[]> {
  const nameByUserId = await resolveUserDisplayNames(
    rows.map((row) => row.added_by),
  );

  return rows.map((row) => ({
    id: row.id,
    amount_added: Number(row.amount_added),
    date_added: row.date_added,
    added_by: row.added_by,
    added_by_name: nameFromMap(nameByUserId, row.added_by),
    notes: row.notes,
  }));
}

export async function getPettyCashSummary(): Promise<PettyCashSummary> {
  await requireExpenseRead();

  const supabase = await createClient();
  const [
    { data: balanceData, error: balanceError },
    { data: lastTopUpRows, error: lastTopUpError },
    { count: totalTopUps, error: countError },
  ] = await Promise.all([
    supabase.rpc("get_petty_cash_balance"),
    supabase
      .from("petty_cash_top_ups")
      .select("id, amount_added, date_added, added_by, notes")
      .order("date_added", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("petty_cash_top_ups")
      .select("id", { count: "exact", head: true }),
  ]);

  if (balanceError) {
    throw new Error(balanceError.message);
  }

  if (lastTopUpError) {
    throw new Error(lastTopUpError.message);
  }

  if (countError) {
    throw new Error(countError.message);
  }

  const mappedLastTopUps = await mapPettyCashTopUpRows(
    (lastTopUpRows ?? []) as PettyCashTopUpDbRow[],
  );

  return {
    balance: Number(balanceData ?? 0),
    lastTopUp: mappedLastTopUps[0] ?? null,
    totalTopUps: totalTopUps ?? 0,
  };
}

export async function getPettyCashTopUpsList(
  page = 1,
): Promise<{ rows: PettyCashTopUpRow[]; total: number }> {
  await requireExpenseRead();

  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("petty_cash_top_ups")
    .select("id, amount_added, date_added, added_by, notes", { count: "exact" })
    .order("date_added", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return {
    rows: await mapPettyCashTopUpRows((data ?? []) as PettyCashTopUpDbRow[]),
    total: count ?? 0,
  };
}

export async function addPettyCashTopUp(formData: FormData) {
  const session = await requireExpenseApprove();
  const actorUserId = requireActorUserId(session);

  const amountRaw = String(formData.get("amount_added") ?? "").trim();
  const amount = Number.parseFloat(amountRaw);
  const dateAdded = String(formData.get("date_added") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a valid top-up amount." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("petty_cash_top_ups").insert({
    amount_added: amount,
    date_added: dateAdded || undefined,
    added_by: actorUserId,
    notes,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/expenses");
  revalidatePath("/expenses/daily");
  return { success: true };
}

export async function getDailyExpensesList(
  page = 1,
  query = "",
  status?: ExpenseRecordStatus,
): Promise<{ rows: DailyExpenseListRow[]; total: number }> {
  await requireExpenseRead();

  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const term = query.trim();

  let listQuery = supabase
    .from("daily_expenses")
    .select(DAILY_EXPENSE_SELECT, { count: "exact" })
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (status) {
    listQuery = listQuery.eq("status", status);
  }

  if (term) {
    listQuery = listQuery.or(
      `description.ilike.%${term}%,notes.ilike.%${term}%`,
    );
  }

  const { data, error, count } = await listQuery.range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return {
    rows: await mapDailyExpenseRows((data ?? []) as DailyExpenseRow[]),
    total: count ?? 0,
  };
}

export async function createDailyExpense(formData: FormData) {
  const session = await requireExpenseWrite();
  const actorUserId = requireActorUserId(session);
  const autoApprove = canApproveExpense(session.role);
  const now = new Date().toISOString();

  const expenseDate = String(formData.get("expense_date") ?? "").trim();
  const category = String(formData.get("expense_category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const paymentMethod = String(formData.get("payment_method") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (
    !DAILY_EXPENSE_CATEGORIES.includes(category as DailyExpenseCategory)
  ) {
    return { error: "Select a valid category." };
  }

  if (!description) {
    return { error: "Description is required." };
  }

  const amount = Number.parseFloat(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a valid amount." };
  }

  if (
    !EXPENSE_PAYMENT_METHODS.includes(paymentMethod as ExpensePaymentMethod)
  ) {
    return { error: "Select a valid payment method." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("daily_expenses").insert({
    expense_date: expenseDate || undefined,
    expense_category: category,
    description,
    amount,
    payment_method: paymentMethod,
    notes,
    entered_by: actorUserId,
    status: autoApprove ? "payment_made" : "pending_approval",
    approved_by: autoApprove ? actorUserId : null,
    approved_at: autoApprove ? now : null,
    payment_made_at: autoApprove ? now : null,
    payment_made_by: autoApprove ? actorUserId : null,
  });

  if (error) {
    if (error.message.includes("exceeds petty cash balance")) {
      return { error: "This expense exceeds the petty cash balance." };
    }

    return { error: error.message };
  }

  revalidatePath("/expenses");
  revalidatePath("/expenses/daily");
  return { success: true };
}

export async function approveDailyExpense(dailyExpenseId: string) {
  const session = await requireExpenseApprove();
  const actorUserId = requireActorUserId(session);

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("daily_expenses")
    .select("id, status")
    .eq("id", dailyExpenseId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!existing) {
    return { error: "Daily expense not found." };
  }

  if (existing.status === "approved") {
    return { error: "Daily expense is already approved." };
  }

  if (existing.status === "payment_made") {
    return { error: "Daily expense payment was already confirmed." };
  }

  const { data: updated, error } = await supabase
    .from("daily_expenses")
    .update({
      status: "approved",
      approved_by: actorUserId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", dailyExpenseId)
    .eq("status", "pending_approval")
    .select("id, status")
    .maybeSingle();

  if (error) {
    if (error.message.includes("exceeds petty cash balance")) {
      return {
        error:
          "Approving this expense would exceed the petty cash balance.",
      };
    }

    return { error: error.message };
  }

  if (!updated || updated.status !== "approved") {
    return {
      error:
        "Daily expense could not be approved. It may already be approved.",
    };
  }

  revalidatePath("/expenses");
  revalidatePath("/expenses/daily");
  return { success: true };
}

export async function approveDailyExpenseAction(dailyExpenseId: string) {
  const result = await approveDailyExpense(dailyExpenseId);
  if (result.error) {
    throw new Error(result.error);
  }
}

export async function markDailyExpensePaymentMade(dailyExpenseId: string) {
  const session = await requireExpensePaidNow();
  const actorUserId = requireActorUserId(session);

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("daily_expenses")
    .select("id, status, entered_by")
    .eq("id", dailyExpenseId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!existing) {
    return { error: "Daily expense not found." };
  }

  const initiatorRole = await resolveInitiatorRole(
    supabase,
    existing.entered_by,
  );

  if (
    !accountsCanConfirmExpensePayment({
      initiatorId: existing.entered_by,
      initiatorRole,
      currentUserId: actorUserId,
    })
  ) {
    return {
      error:
        "You can only confirm payment on expenses you entered, or on admin-entered expenses after approval.",
    };
  }

  if (existing.status === "pending_approval") {
    return { error: "This expense must be approved before payment can be confirmed." };
  }

  if (existing.status === "payment_made") {
    return { error: "Payment was already marked as made." };
  }

  const { data: updated, error } = await supabase
    .from("daily_expenses")
    .update({
      status: "payment_made",
      payment_made_at: new Date().toISOString(),
      payment_made_by: existing.entered_by,
    })
    .eq("id", dailyExpenseId)
    .eq("status", "approved")
    .select("id, status")
    .maybeSingle();

  if (error) {
    if (error.message.includes("exceeds petty cash balance")) {
      return { error: "This expense exceeds the petty cash balance." };
    }

    return { error: error.message };
  }

  if (!updated || updated.status !== "payment_made") {
    return {
      error:
        "Payment could not be confirmed. The expense may no longer be approved.",
    };
  }

  revalidatePath("/expenses");
  revalidatePath("/expenses/daily");
  return { success: true };
}

export async function markDailyExpensePaymentMadeAction(dailyExpenseId: string) {
  const result = await markDailyExpensePaymentMade(dailyExpenseId);
  if (result.error) {
    throw new Error(result.error);
  }
}

export async function getOperationalExpensesList(
  page = 1,
  query = "",
  status?: ExpenseRecordStatus,
): Promise<{ rows: OperationalExpenseListRow[]; total: number }> {
  await requireExpenseRead();

  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const term = query.trim();

  let listQuery = supabase
    .from("operational_expenses")
    .select(OPERATIONAL_EXPENSE_SELECT, { count: "exact" })
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (status) {
    listQuery = listQuery.eq("status", status);
  }

  if (term) {
    listQuery = listQuery.or(
      `description.ilike.%${term}%,notes.ilike.%${term}%`,
    );
  }

  const { data, error, count } = await listQuery.range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return {
    rows: await mapOperationalExpenseRows(
      (data ?? []) as OperationalExpenseRow[],
    ),
    total: count ?? 0,
  };
}

export async function createOperationalExpense(formData: FormData) {
  const session = await requireExpenseWrite();
  const actorUserId = requireActorUserId(session);
  const autoApprove = canApproveExpense(session.role);
  const now = new Date().toISOString();

  const expenseType = String(formData.get("expense_type") ?? "").trim();
  const expenseDate = String(formData.get("expense_date") ?? "").trim();
  const bagsRaw = String(formData.get("bags") ?? "").trim();
  const rateRaw = String(formData.get("rate_per_bag") ?? "").trim();
  const paymentMethod = String(formData.get("payment_method") ?? "").trim();
  const descriptionRaw = String(formData.get("description") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const processingSessionId =
    String(formData.get("processing_session_id") ?? "").trim() || null;
  const inventoryBatchId =
    String(formData.get("inventory_batch_id") ?? "").trim() || null;
  const procurementBatchId =
    String(formData.get("procurement_batch_id") ?? "").trim() || null;
  const preStockId = String(formData.get("pre_stock_id") ?? "").trim() || null;
  const shipmentId = String(formData.get("shipment_id") ?? "").trim() || null;

  if (
    !OPERATIONAL_EXPENSE_TYPES.includes(expenseType as OperationalExpenseType)
  ) {
    return { error: "Select a valid expense type." };
  }

  const rule =
    OPERATIONAL_EXPENSE_LINK_RULES[expenseType as OperationalExpenseType];

  if (rule.disabled) {
    return { error: rule.disabledReason ?? "This expense type is unavailable." };
  }

  const bags = Number.parseInt(bagsRaw, 10);
  const ratePerBag = Number.parseFloat(rateRaw);

  if (!Number.isFinite(bags) || bags <= 0) {
    return { error: "Enter a valid bag count." };
  }

  if (!Number.isFinite(ratePerBag) || ratePerBag < 0) {
    return { error: "Enter a valid rate per bag." };
  }

  if (
    !EXPENSE_PAYMENT_METHODS.includes(paymentMethod as ExpensePaymentMethod)
  ) {
    return { error: "Select a valid payment method." };
  }

  if (expenseType === "miscellaneous") {
    if (!descriptionRaw) {
      return { error: "Enter a description for this miscellaneous expense." };
    }
  } else if (descriptionRaw) {
    return { error: "Description is only used for miscellaneous expenses." };
  }

  const totalAmount = calcOperationalTotal(bags, ratePerBag);
  const supabase = await createClient();

  const payload: Record<string, unknown> = {
    expense_type: expenseType,
    expense_date: expenseDate || undefined,
    bags,
    rate_per_bag: ratePerBag,
    total_amount: totalAmount,
    payment_method: paymentMethod,
    description: expenseType === "miscellaneous" ? descriptionRaw : null,
    notes,
    paid_by: actorUserId,
    status: autoApprove ? "payment_made" : "pending_approval",
    approved_by: autoApprove ? actorUserId : null,
    approved_at: autoApprove ? now : null,
    payment_made_at: autoApprove ? now : null,
    payment_made_by: autoApprove ? actorUserId : null,
    processing_session_id: null,
    inventory_batch_id: null,
    procurement_batch_id: null,
    pre_stock_id: null,
    shipment_id: null,
  };

  if (rule.requiredField === "processing_session_id") {
    if (!processingSessionId) {
      return { error: "Select a processing session." };
    }

    if (expenseType === "cleaning") {
      const cleaningValidation = await validateCleaningOperationalExpense(
        supabase,
        processingSessionId,
        bags,
      );
      if (cleaningValidation.error) {
        return { error: cleaningValidation.error };
      }
    }

    if (expenseType === "field_transfer_out") {
      const transferValidation = await validateFieldTransferOutOperationalExpense(
        supabase,
        processingSessionId,
        bags,
      );
      if (transferValidation.error) {
        return { error: transferValidation.error };
      }
    }

    payload.processing_session_id = processingSessionId;
  } else if (rule.requiredField === "inventory_batch_id") {
    if (!inventoryBatchId) {
      return { error: "Select an inventory batch." };
    }

    if (expenseType === "grading") {
      const gradingValidation = await validateGradingOperationalExpense(
        supabase,
        inventoryBatchId,
        bags,
      );
      if (gradingValidation.error) {
        return { error: gradingValidation.error };
      }
    }

    payload.inventory_batch_id = inventoryBatchId;
  } else if (rule.requiredField === "procurement_batch_id") {
    if (!procurementBatchId) {
      return { error: "Select an off-site procurement batch." };
    }

    if (expenseType === "truck_offloading") {
      const truckValidation = await validateTruckOffloadingOperationalExpense(
        supabase,
        procurementBatchId,
        bags,
      );
      if (truckValidation.error) {
        return { error: truckValidation.error };
      }
    }

    payload.procurement_batch_id = procurementBatchId;
  } else if (rule.requiredField === "pre_stock_id") {
    if (!preStockId) {
      return { error: "Select a pre-stock record." };
    }

    if (expenseType === "field_transfer_in") {
      const transferInValidation = await validateFieldTransferInOperationalExpense(
        supabase,
        preStockId,
        bags,
      );
      if (transferInValidation.error) {
        return { error: transferInValidation.error };
      }
    }

    payload.pre_stock_id = preStockId;
  } else if (rule.requiredField === "shipment_id") {
    if (!shipmentId) {
      return { error: "Select a shipment." };
    }

    if (expenseType === "warehouse_loading") {
      const loadingValidation = await validateWarehouseLoadingOperationalExpense(
        supabase,
        shipmentId,
        bags,
      );
      if (loadingValidation.error) {
        return { error: loadingValidation.error };
      }
    }

    payload.shipment_id = shipmentId;
  }

  const { error } = await supabase.from("operational_expenses").insert(payload);

  if (error) {
    if (error.message.includes("off-site procurement")) {
      return {
        error: "Truck offloading must link to an off-site procurement batch.",
      };
    }

    if (error.message.includes("operational_expenses_cleaning_session_unique")) {
      return {
        error: "A cleaning expense has already been submitted for this processing session.",
      };
    }

    if (
      error.message.includes("operational_expenses_field_transfer_out_session_unique")
    ) {
      return {
        error: "A field transfer out expense has already been submitted for this processing session.",
      };
    }

    if (error.message.includes("operational_expenses_grading_batch_unique")) {
      return {
        error: "A grading expense has already been submitted for this inventory batch.",
      };
    }

    if (
      error.message.includes("operational_expenses_truck_offloading_batch_unique")
    ) {
      return {
        error: "A truck offloading expense has already been submitted for this procurement batch.",
      };
    }

    if (
      error.message.includes("operational_expenses_field_transfer_in_pre_stock_unique")
    ) {
      return {
        error: "A field transfer in expense has already been submitted for this pre-stock record.",
      };
    }

    if (
      error.message.includes("operational_expenses_warehouse_loading_shipment_unique")
    ) {
      return {
        error: "A warehouse loading expense has already been submitted for this shipment.",
      };
    }

    return { error: error.message };
  }

  revalidatePath("/expenses");
  revalidatePath("/expenses/operational");
  return { success: true };
}

export async function approveOperationalExpense(operationalExpenseId: string) {
  const session = await requireExpenseApprove();
  const actorUserId = requireActorUserId(session);

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("operational_expenses")
    .select("id, status")
    .eq("id", operationalExpenseId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!existing) {
    return { error: "Operational expense not found." };
  }

  if (existing.status === "approved") {
    return { error: "Operational expense is already approved." };
  }

  if (existing.status === "payment_made") {
    return { error: "Operational expense payment was already confirmed." };
  }

  const { data: updated, error } = await supabase
    .from("operational_expenses")
    .update({
      status: "approved",
      approved_by: actorUserId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", operationalExpenseId)
    .eq("status", "pending_approval")
    .select("id, status")
    .maybeSingle();

  if (error) {
    if (error.message.includes("exceeds petty cash balance")) {
      return {
        error:
          "Approving this expense would exceed the petty cash balance.",
      };
    }

    return { error: error.message };
  }

  if (!updated || updated.status !== "approved") {
    return {
      error:
        "Operational expense could not be approved. It may already be approved.",
    };
  }

  revalidatePath("/expenses");
  revalidatePath("/expenses/operational");
  revalidatePath("/expenses");
  revalidatePath("/expenses/daily");
  return { success: true };
}

export async function approveOperationalExpenseAction(
  operationalExpenseId: string,
) {
  const result = await approveOperationalExpense(operationalExpenseId);
  if (result.error) {
    throw new Error(result.error);
  }
}

export async function markOperationalExpensePaymentMade(
  operationalExpenseId: string,
) {
  const session = await requireExpensePaidNow();
  const actorUserId = requireActorUserId(session);

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("operational_expenses")
    .select("id, status, paid_by")
    .eq("id", operationalExpenseId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!existing) {
    return { error: "Operational expense not found." };
  }

  const initiatorRole = await resolveInitiatorRole(supabase, existing.paid_by);

  if (
    !accountsCanConfirmExpensePayment({
      initiatorId: existing.paid_by,
      initiatorRole,
      currentUserId: actorUserId,
    })
  ) {
    return {
      error:
        "You can only confirm payment on expenses you recorded, or on admin-recorded expenses after approval.",
    };
  }

  if (existing.status === "pending_approval") {
    return {
      error: "This expense must be approved before payment can be confirmed.",
    };
  }

  if (existing.status === "payment_made") {
    return { error: "Payment was already marked as made." };
  }

  const { data: updated, error } = await supabase
    .from("operational_expenses")
    .update({
      status: "payment_made",
      payment_made_at: new Date().toISOString(),
      payment_made_by: existing.paid_by,
    })
    .eq("id", operationalExpenseId)
    .eq("status", "approved")
    .select("id, status")
    .maybeSingle();

  if (error) {
    if (error.message.includes("exceeds petty cash balance")) {
      return { error: "This expense exceeds the petty cash balance." };
    }

    return { error: error.message };
  }

  if (!updated || updated.status !== "payment_made") {
    return {
      error:
        "Payment could not be confirmed. The expense may no longer be approved.",
    };
  }

  revalidatePath("/expenses");
  revalidatePath("/expenses/operational");
  return { success: true };
}

export async function markOperationalExpensePaymentMadeAction(
  operationalExpenseId: string,
) {
  const result = await markOperationalExpensePaymentMade(operationalExpenseId);
  if (result.error) {
    throw new Error(result.error);
  }
}

export async function getCleaningProcessingSessionsForExpenseLink(): Promise<
  ProcessingExpenseLinkOption[]
> {
  return getProcessingSessionsForOperationalExpenseLink("cleaning");
}

export async function getFieldTransferOutProcessingSessionsForExpenseLink(): Promise<
  ProcessingExpenseLinkOption[]
> {
  return getProcessingSessionsForOperationalExpenseLink("field_transfer_out");
}

async function getProcessingSessionsForOperationalExpenseLink(
  expenseType: "cleaning" | "field_transfer_out",
): Promise<ProcessingExpenseLinkOption[]> {
  await requireExpenseRead();

  const supabase = await createClient();
  const claimedSessionIds = await getClaimedProcessingSessionIds(
    supabase,
    expenseType,
  );

  const { data, error } = await supabase
    .from("processing_sessions")
    .select(
      `
      id,
      session_number,
      bags_sent,
      processing_date,
      procurement_batches!inner(batch_number)
    `,
    )
    .eq("status", "completed")
    .order("processing_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .filter((row) => !claimedSessionIds.has(row.id))
    .map((row) => {
      const batch = joinOne(
        row.procurement_batches as
          | { batch_number: string }
          | { batch_number: string }[]
          | null,
      );

      return {
        id: row.id,
        label: `${row.session_number} — ${batch?.batch_number ?? "Batch"} (${row.bags_sent} bags sent)`,
        href: `/processing/${row.id}`,
        bagsSent: row.bags_sent,
      };
    });
}

export const getCleaningPaymentDueCount = cache(async (): Promise<number> => {
  return getProcessingSessionPaymentDueCount("cleaning");
});

export const getFieldTransferOutPaymentDueCount = cache(
  async (): Promise<number> => {
    return getProcessingSessionPaymentDueCount("field_transfer_out");
  },
);

async function getProcessingSessionPaymentDueCount(
  expenseType: "cleaning" | "field_transfer_out",
): Promise<number> {
  await requireExpenseRead();

  const supabase = await createClient();
  const claimedSessionIds = await getClaimedProcessingSessionIds(
    supabase,
    expenseType,
  );

  return countUnclaimedRows(supabase, "processing_sessions", claimedSessionIds, {
    status: "completed",
  });
}

async function getClaimedProcessingSessionIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  expenseType: "cleaning" | "field_transfer_out",
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("operational_expenses")
    .select("processing_session_id")
    .eq("expense_type", expenseType)
    .in("status", [...EXPENSE_IN_FLIGHT_STATUSES])
    .not("processing_session_id", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  return new Set(
    (data ?? [])
      .map((row) => row.processing_session_id)
      .filter(Boolean) as string[],
  );
}

export async function getProcessingSessionsForExpenseLink(): Promise<
  ExpenseLinkOption[]
> {
  await requireExpenseRead();

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
    .eq("status", "completed")
    .order("processing_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const batch = joinOne(
      row.procurement_batches as
        | { batch_number: string }
        | { batch_number: string }[]
        | null,
    );

    return {
      id: row.id,
      label: `${row.session_number} — ${batch?.batch_number ?? "Batch"}`,
      href: `/processing/${row.id}`,
    };
  });
}

export async function getInventoryBatchesForExpenseLink(): Promise<
  InventoryExpenseLinkOption[]
> {
  await requireExpenseRead();

  const supabase = await createClient();
  const claimedBatchIds = await getClaimedGradingInventoryBatchIds(supabase);

  const { data, error } = await supabase
    .from("inventory_batches")
    .select("id, inventory_number, product_type, bags")
    .order("date_graded", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .filter((row) => !claimedBatchIds.has(row.id))
    .map((row) => ({
      id: row.id,
      label: `${row.inventory_number} — ${row.product_type} (${row.bags.toLocaleString()} bags)`,
      href: `/inventory/export/${row.id}`,
      bags: row.bags,
    }));
}

export const getGradingPaymentDueCount = cache(async (): Promise<number> => {
  await requireExpenseRead();

  const supabase = await createClient();
  const claimedBatchIds = await getClaimedGradingInventoryBatchIds(supabase);

  return countUnclaimedRows(supabase, "inventory_batches", claimedBatchIds);
});

async function getClaimedGradingInventoryBatchIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("operational_expenses")
    .select("inventory_batch_id")
    .eq("expense_type", "grading")
    .in("status", [...EXPENSE_IN_FLIGHT_STATUSES])
    .not("inventory_batch_id", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  return new Set(
    (data ?? [])
      .map((row) => row.inventory_batch_id)
      .filter(Boolean) as string[],
  );
}

export async function getOffSiteProcurementForExpenseLink(): Promise<
  ProcurementExpenseLinkOption[]
> {
  await requireExpenseRead();

  const supabase = await createClient();
  const claimedBatchIds = await getClaimedProcurementBatchIds(
    supabase,
    "truck_offloading",
  );

  const { data, error } = await supabase
    .from("procurement_batches")
    .select("id, batch_number, number_of_bags, suppliers(supplier_name)")
    .eq("procurement_type", "off_site")
    .eq("status", "approved")
    .order("procurement_date", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .filter((row) => !claimedBatchIds.has(row.id))
    .map((row) => {
      const supplier = joinOne(
        row.suppliers as
          | { supplier_name: string }
          | { supplier_name: string }[]
          | null,
      );

      return {
        id: row.id,
        label: `${row.batch_number} — ${supplier?.supplier_name ?? "Supplier"} (${row.number_of_bags.toLocaleString()} bags)`,
        href: `/procurement/${row.id}`,
        bags: row.number_of_bags,
      };
    });
}

export const getTruckOffloadingPaymentDueCount = cache(
  async (): Promise<number> => {
    await requireExpenseRead();

    const supabase = await createClient();
    const claimedBatchIds = await getClaimedProcurementBatchIds(
      supabase,
      "truck_offloading",
    );

    return countUnclaimedRows(supabase, "procurement_batches", claimedBatchIds, {
      procurement_type: "off_site",
      status: "approved",
    });
  },
);

async function getClaimedProcurementBatchIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  expenseType: "truck_offloading",
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("operational_expenses")
    .select("procurement_batch_id")
    .eq("expense_type", expenseType)
    .in("status", [...EXPENSE_IN_FLIGHT_STATUSES])
    .not("procurement_batch_id", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  return new Set(
    (data ?? [])
      .map((row) => row.procurement_batch_id)
      .filter(Boolean) as string[],
  );
}

export async function getPreStockForExpenseLink(): Promise<
  PreStockExpenseLinkOption[]
> {
  await requireExpenseRead();

  const supabase = await createClient();
  const claimedPreStockIds = await getClaimedPreStockIds(
    supabase,
    "field_transfer_in",
  );

  const { data, error } = await supabase
    .from("pre_stock")
    .select("id, pre_stock_number, product_type, bags_received")
    .order("date_received", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .filter((row) => !claimedPreStockIds.has(row.id))
    .map((row) => ({
      id: row.id,
      label: `${row.pre_stock_number} — ${row.product_type} (${row.bags_received.toLocaleString()} bags)`,
      href: `/inventory/pre-stock/${row.id}`,
      bags: row.bags_received,
    }));
}

export const getFieldTransferInPaymentDueCount = cache(
  async (): Promise<number> => {
    await requireExpenseRead();

    const supabase = await createClient();
    const claimedPreStockIds = await getClaimedPreStockIds(
      supabase,
      "field_transfer_in",
    );

    return countUnclaimedRows(supabase, "pre_stock", claimedPreStockIds);
  },
);

async function getClaimedPreStockIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  expenseType: "field_transfer_in",
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("operational_expenses")
    .select("pre_stock_id")
    .eq("expense_type", expenseType)
    .in("status", [...EXPENSE_IN_FLIGHT_STATUSES])
    .not("pre_stock_id", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  return new Set(
    (data ?? []).map((row) => row.pre_stock_id).filter(Boolean) as string[],
  );
}

async function resolveInitiatorRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string | null,
): Promise<AppRole | null> {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data?.role as AppRole | undefined) ?? null;
}

async function getApproverUserIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .in("role", ["admin", "super_admin"]);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => row.id as string);
}

async function countApprovedAwaitingPaymentForAccounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "daily_expenses" | "operational_expenses",
  accountsUserId: string,
): Promise<number> {
  const approverIds = await getApproverUserIds(supabase);
  const initiatorColumn = table === "daily_expenses" ? "entered_by" : "paid_by";

  const filters = [`${initiatorColumn}.eq.${accountsUserId}`];
  if (approverIds.length > 0) {
    filters.push(`${initiatorColumn}.in.(${approverIds.join(",")})`);
  }

  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("status", "approved")
    .or(filters.join(","));

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export const getExpenseNotifications = cache(
  async (): Promise<ExpenseNotifications> => {
    const actor = await getNotificationActor();
    if (!actor) {
      return EMPTY_EXPENSE_NOTIFICATIONS;
    }

    const { userId, role } = actor;

    if (!canReceiveExpenseNotifications(role)) {
      return EMPTY_EXPENSE_NOTIFICATIONS;
    }

    const supabase = await createClient();

    if (role === "super_admin" || role === "admin") {
      const [dailyPending, operationalPending] = await Promise.all([
        supabase
          .from("daily_expenses")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending_approval"),
        supabase
          .from("operational_expenses")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending_approval"),
      ]);

      return {
        pendingApproval:
          (dailyPending.count ?? 0) + (operationalPending.count ?? 0),
        submittedPending: 0,
      };
    }

    const [dailySubmitted, operationalSubmitted] = await Promise.all([
      supabase
        .from("daily_expenses")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_approval")
        .eq("entered_by", userId),
      supabase
        .from("operational_expenses")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_approval")
        .eq("paid_by", userId),
    ]);

    const submittedPending =
      (dailySubmitted.count ?? 0) + (operationalSubmitted.count ?? 0);

    return {
      pendingApproval: submittedPending,
      submittedPending,
    };
  },
);

export const getDailyExpenseNotificationCounts = cache(async (): Promise<{
  pendingApproval: number;
  submittedPending: number;
  approvedAwaitingPayment: number;
}> => {
  const actor = await getNotificationActor();
  if (!actor) {
    return {
      pendingApproval: 0,
      submittedPending: 0,
      approvedAwaitingPayment: 0,
    };
  }

  const supabase = await createClient();
  const { role, userId } = actor;

  const approvedAwaitingPayment =
    role === "cash_manager"
      ? await countApprovedAwaitingPaymentForAccounts(
          supabase,
          "daily_expenses",
          userId,
        )
      : 0;

  if (role === "super_admin" || role === "admin") {
    const { count } = await supabase
      .from("daily_expenses")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_approval");

    return {
      pendingApproval: count ?? 0,
      submittedPending: 0,
      approvedAwaitingPayment,
    };
  }

  const { count } = await supabase
    .from("daily_expenses")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending_approval")
    .eq("entered_by", userId);

  return {
    pendingApproval: 0,
    submittedPending: count ?? 0,
    approvedAwaitingPayment,
  };
});

const operationalNotificationCountsCache =
  createMemoryTtlCache<OperationalExpenseNotificationCounts>(30_000);

export async function getOperationalExpenseNotificationCounts(): Promise<OperationalExpenseNotificationCounts> {
  const actor = await getNotificationActor();
  if (!actor) {
    return {
      pendingApproval: 0,
      submittedPending: 0,
      approvedAwaitingPayment: 0,
      cleaningAwaitingRecord: 0,
      gradingAwaitingRecord: 0,
      fieldTransferOutAwaitingRecord: 0,
      fieldTransferInAwaitingRecord: 0,
      truckOffloadingAwaitingRecord: 0,
      pendingApprovalByType: emptyOperationalPendingByType(),
    };
  }

  const cacheKey = `${actor.userId}:${actor.role}`;
  const cached = operationalNotificationCountsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await loadOperationalExpenseNotificationCounts(actor);
  operationalNotificationCountsCache.set(cacheKey, result);
  return result;
}

/** Approval counts only — skips five “awaiting record” queue scans (use on non-operational tabs). */
export const getOperationalExpenseApprovalCountsLight = cache(async (): Promise<
  Pick<
    OperationalExpenseNotificationCounts,
    | "pendingApproval"
    | "submittedPending"
    | "approvedAwaitingPayment"
    | "pendingApprovalByType"
  >
> => {
  const actor = await getNotificationActor();
  if (!actor) {
    return {
      pendingApproval: 0,
      submittedPending: 0,
      approvedAwaitingPayment: 0,
      pendingApprovalByType: emptyOperationalPendingByType(),
    };
  }

  const supabase = await createClient();
  const [pendingApprovalByType, approvedAwaitingPayment] = await Promise.all([
    loadPendingApprovalByType(supabase, actor.role, actor.userId),
    actor.role === "cash_manager"
      ? countApprovedAwaitingPaymentForAccounts(
          supabase,
          "operational_expenses",
          actor.userId,
        )
      : Promise.resolve(0),
  ]);
  const pendingApproval = Object.values(pendingApprovalByType).reduce(
    (sum, count) => sum + count,
    0,
  );

  if (actor.role === "super_admin" || actor.role === "admin") {
    return {
      pendingApproval,
      submittedPending: 0,
      approvedAwaitingPayment,
      pendingApprovalByType,
    };
  }

  return {
    pendingApproval: 0,
    submittedPending: pendingApproval,
    approvedAwaitingPayment,
    pendingApprovalByType,
  };
});

/** One fetch per request for hub tabs + banners (deduped via React cache). */
export const getExpensesHubNotificationSnapshot = cache(async () => {
  const [dailyCounts, operationalLight] = await Promise.all([
    getDailyExpenseNotificationCounts(),
    getOperationalExpenseApprovalCountsLight(),
  ]);

  return {
    dailyCounts,
    operationalCounts: {
      ...EMPTY_OPERATIONAL_EXPENSE_NOTIFICATIONS,
      ...operationalLight,
    } satisfies OperationalExpenseNotificationCounts,
  };
});

async function loadOperationalExpenseNotificationCounts(actor: {
  role: AppRole;
  userId: string;
}): Promise<OperationalExpenseNotificationCounts> {
  const supabase = await createClient();
  const { role, userId } = actor;
  const [
    cleaningAwaitingRecord,
    gradingAwaitingRecord,
    fieldTransferOutAwaitingRecord,
    fieldTransferInAwaitingRecord,
    truckOffloadingAwaitingRecord,
    pendingApprovalByType,
    approvedAwaitingPayment,
  ] = await Promise.all([
    getCleaningPaymentDueCount(),
    getGradingPaymentDueCount(),
    getFieldTransferOutPaymentDueCount(),
    getFieldTransferInPaymentDueCount(),
    getTruckOffloadingPaymentDueCount(),
    loadPendingApprovalByType(supabase, role, userId),
    role === "cash_manager"
      ? countApprovedAwaitingPaymentForAccounts(
          supabase,
          "operational_expenses",
          userId,
        )
      : Promise.resolve(0),
  ]);

  const pendingApproval = Object.values(pendingApprovalByType).reduce(
    (sum, count) => sum + count,
    0,
  );

  const result =
    role === "super_admin" || role === "admin"
      ? {
          pendingApproval,
          submittedPending: 0,
          approvedAwaitingPayment: 0,
          cleaningAwaitingRecord,
          gradingAwaitingRecord,
          fieldTransferOutAwaitingRecord,
          fieldTransferInAwaitingRecord,
          truckOffloadingAwaitingRecord,
          pendingApprovalByType,
        }
      : {
          pendingApproval: 0,
          submittedPending: pendingApproval,
          approvedAwaitingPayment,
          cleaningAwaitingRecord,
          gradingAwaitingRecord,
          fieldTransferOutAwaitingRecord,
          fieldTransferInAwaitingRecord,
          truckOffloadingAwaitingRecord,
          pendingApprovalByType,
        };

  return result;
}

async function loadPendingApprovalByType(
  supabase: Awaited<ReturnType<typeof createClient>>,
  role: AppRole,
  userId: string,
): Promise<OperationalExpensePendingByType> {
  const counts = emptyOperationalPendingByType();

  let query = supabase
    .from("operational_expenses")
    .select("expense_type")
    .eq("status", "pending_approval");

  if (role !== "super_admin" && role !== "admin") {
    query = query.eq("paid_by", userId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  for (const row of data ?? []) {
    const expenseType = String(row.expense_type ?? "") as OperationalExpenseType;
    if (OPERATIONAL_EXPENSE_TYPES.includes(expenseType)) {
      counts[expenseType] += 1;
    }
  }

  return counts;
}

async function safeExpenseLinkLoad<T>(
  label: string,
  loader: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    console.error(`getOperationalExpenseLinkOptions (${label}):`, error);
    return fallback;
  }
}

export const getOperationalExpenseLinkOptions = cache(async () => {
  await requireExpenseRead();

  const [
    cleaningProcessingSessions,
    fieldTransferOutProcessingSessions,
    processingSessions,
    inventoryBatches,
    offSiteProcurement,
    preStock,
    shipments,
  ] = await Promise.all([
    safeExpenseLinkLoad(
      "cleaning",
      getCleaningProcessingSessionsForExpenseLink,
      [],
    ),
    safeExpenseLinkLoad(
      "field_transfer_out",
      getFieldTransferOutProcessingSessionsForExpenseLink,
      [],
    ),
    safeExpenseLinkLoad("processing", getProcessingSessionsForExpenseLink, []),
    safeExpenseLinkLoad("inventory", getInventoryBatchesForExpenseLink, []),
    safeExpenseLinkLoad(
      "off_site_procurement",
      getOffSiteProcurementForExpenseLink,
      [],
    ),
    safeExpenseLinkLoad("pre_stock", getPreStockForExpenseLink, []),
    safeExpenseLinkLoad("shipments", getShipmentsForExpenseLink, []),
  ]);

  return {
    cleaningProcessingSessions,
    fieldTransferOutProcessingSessions,
    processingSessions,
    inventoryBatches,
    offSiteProcurement,
    preStock,
    shipments,
  };
});
