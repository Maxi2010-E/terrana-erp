"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";

import { requireActorUserId } from "@/lib/auth/actor-id";
import { getNotificationActor } from "@/lib/notifications/actor";
import {
  requirePaymentApprove,
  requirePaymentRead,
  requirePaymentWrite,
  requireSuperAdmin,
} from "@/lib/auth/require-role";
import { PAGE_SIZE } from "@/lib/employees/constants";
import { calcOutstanding } from "@/lib/payments/balance";
import {
  PAYMENT_METHODS,
  type PaymentMethod,
  type PaymentQueueFilter,
  type PaymentRecordStatus,
} from "@/lib/payments/constants";
import type {
  BatchPaymentOption,
  BatchPaymentSummary,
  PaymentBankAccountSummary,
  PaymentDashboardCounts,
  PaymentHistoryRow,
  PaymentQueueRow,
  SupplierPaymentDetail,
  SupplierPaymentRow,
  SupplierWithOutstandingOption,
} from "@/lib/payments/types";
import {
  EMPTY_PAYMENT_NOTIFICATIONS,
  type PaymentNotifications,
  canReceivePaymentNotifications,
} from "@/lib/payments/notifications";
import type { PaymentStatus } from "@/lib/procurement/constants";
import type { AppRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { nameFromMap, resolveUserDisplayNames } from "@/lib/users/resolve-user-names";

type BatchRow = {
  id: string;
  batch_number: string;
  supplier_id: string;
  product_type: string;
  total_value: number;
  payment_status: PaymentStatus;
  procurement_date: string;
  status: string;
  suppliers: {
    supplier_code: string;
    supplier_name: string;
  } | null;
};

type PaymentRow = {
  id: string;
  payment_reference: string;
  supplier_id: string;
  batch_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  status: PaymentRecordStatus;
  notes: string | null;
  bank_account_id: string | null;
  recorded_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  suppliers:
    | { supplier_code: string; supplier_name: string }
    | { supplier_code: string; supplier_name: string }[]
    | null;
  procurement_batches:
    | { batch_number: string; total_value: number; product_type: string }
    | { batch_number: string; total_value: number; product_type: string }[]
    | null;
  supplier_bank_accounts:
    | PaymentBankAccountSummary
    | PaymentBankAccountSummary[]
    | null;
};

type NormalizedPaymentRow = Omit<
  PaymentRow,
  "suppliers" | "procurement_batches" | "supplier_bank_accounts"
> & {
  suppliers: { supplier_code: string; supplier_name: string } | null;
  procurement_batches: {
    batch_number: string;
    total_value: number;
    product_type: string;
  } | null;
  supplier_bank_accounts: PaymentBankAccountSummary | null;
};

const PAYMENT_LIST_SELECT = `
  id,
  payment_reference,
  supplier_id,
  batch_id,
  amount,
  payment_method,
  payment_date,
  status,
  notes,
  bank_account_id,
  recorded_by,
  approved_by,
  approved_at,
  created_at,
  suppliers ( supplier_code, supplier_name ),
  procurement_batches ( batch_number, total_value, product_type ),
  supplier_bank_accounts ( id, bank_name, account_number, account_name, is_primary )
`;

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalizeBatchRow(row: {
  id: string;
  batch_number: string;
  supplier_id: string;
  product_type: string;
  total_value: number;
  payment_status: PaymentStatus;
  procurement_date: string;
  status: string;
  suppliers:
    | { supplier_code: string; supplier_name: string }
    | { supplier_code: string; supplier_name: string }[]
    | null;
}): BatchRow {
  const supplier = firstRelation(row.suppliers);

  return {
    id: row.id,
    batch_number: row.batch_number,
    supplier_id: row.supplier_id,
    product_type: row.product_type,
    total_value: row.total_value,
    payment_status: row.payment_status,
    procurement_date: row.procurement_date,
    status: row.status,
    suppliers: supplier,
  };
}

function normalizePaymentRow(row: PaymentRow): NormalizedPaymentRow {
  return {
    ...row,
    suppliers: firstRelation(row.suppliers),
    procurement_batches: firstRelation(row.procurement_batches),
    supplier_bank_accounts: firstRelation(row.supplier_bank_accounts),
  };
}

async function validatePaymentBankAccount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  supplierId: string,
  paymentMethod: PaymentMethod,
  bankAccountId: string | null,
): Promise<{ bankAccountId: string | null; error?: string }> {
  if (paymentMethod === "cash") {
    return { bankAccountId: null };
  }

  if (!bankAccountId) {
    return { bankAccountId: null, error: "Select a supplier bank account for transfer payments." };
  }

  const { data, error } = await supabase
    .from("supplier_bank_accounts")
    .select("id")
    .eq("id", bankAccountId)
    .eq("supplier_id", supplierId)
    .maybeSingle();

  if (error) {
    return { bankAccountId: null, error: error.message };
  }

  if (!data) {
    return {
      bankAccountId: null,
      error: "Selected bank account does not belong to this supplier.",
    };
  }

  return { bankAccountId };
}

async function loadUserNames(userIds: Array<string | null | undefined>) {
  return resolveUserDisplayNames(userIds);
}

function mapPaymentHistoryRow(
  row: PaymentRow,
  nameByUserId: Map<string, string>,
): PaymentHistoryRow {
  const normalized = normalizePaymentRow(row);

  return {
    id: normalized.id,
    payment_reference: normalized.payment_reference,
    supplier_id: normalized.supplier_id,
    supplier_code: normalized.suppliers?.supplier_code ?? "—",
    supplier_name: normalized.suppliers?.supplier_name ?? "—",
    batch_id: normalized.batch_id,
    batch_number: normalized.procurement_batches?.batch_number ?? "—",
    amount: Number(normalized.amount),
    payment_method: normalized.payment_method,
    payment_date: normalized.payment_date,
    status: normalized.status,
    bank_account_id: normalized.bank_account_id,
    bank_account: normalized.supplier_bank_accounts,
    approved_by_name: nameFromMap(nameByUserId, normalized.approved_by),
    recorded_by_name: nameFromMap(nameByUserId, normalized.recorded_by),
  };
}

async function mapPaymentRows(rows: PaymentRow[]): Promise<PaymentHistoryRow[]> {
  const nameByUserId = await loadUserNames(
    rows.flatMap((row) => [row.recorded_by, row.approved_by]),
  );

  return rows.map((row) => mapPaymentHistoryRow(row, nameByUserId));
}

async function getApprovedPaymentsForBatches(batchIds: string[]) {
  if (batchIds.length === 0) {
    return new Map<string, number>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supplier_payments")
    .select("batch_id, amount, status")
    .in("batch_id", batchIds);

  if (error) {
    throw new Error(error.message);
  }

  const totals = new Map<string, number>();
  for (const row of data ?? []) {
    if (row.status !== "approved") {
      continue;
    }

    const current = totals.get(row.batch_id) ?? 0;
    totals.set(row.batch_id, current + Number(row.amount));
  }

  return totals;
}

export async function getPaymentDashboardCounts(): Promise<PaymentDashboardCounts> {
  await requirePaymentRead();

  const supabase = await createClient();
  const [outstanding, partial, completed, pendingApproval] = await Promise.all([
    supabase
      .from("procurement_batches")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .eq("payment_status", "unpaid"),
    supabase
      .from("procurement_batches")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .eq("payment_status", "partially_paid"),
    supabase
      .from("procurement_batches")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .eq("payment_status", "paid"),
    supabase
      .from("supplier_payments")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_approval"),
  ]);

  return {
    outstanding: outstanding.count ?? 0,
    partial: partial.count ?? 0,
    completed: completed.count ?? 0,
    pendingApproval: pendingApproval.count ?? 0,
  };
}

export async function getPaymentQueue(
  page: number,
  filter: PaymentQueueFilter,
  query = "",
) {
  await requirePaymentRead();

  const supabase = await createClient();
  const paymentStatus: PaymentStatus =
    filter === "outstanding"
      ? "unpaid"
      : filter === "partial"
        ? "partially_paid"
        : "paid";

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let builder = supabase
    .from("procurement_batches")
    .select(
      `
      id,
      batch_number,
      supplier_id,
      product_type,
      total_value,
      payment_status,
      procurement_date,
      status,
      suppliers ( supplier_code, supplier_name )
    `,
      { count: "exact" },
    )
    .eq("status", "approved")
    .eq("payment_status", paymentStatus)
    .order("procurement_date", { ascending: false })
    .range(from, to);

  const trimmed = query.trim();
  if (trimmed) {
    const term = `%${trimmed}%`;
    builder = builder.or(
      `batch_number.ilike.${term},product_type.ilike.${term}`,
    );
  }

  const { data, error, count } = await builder;
  if (error) {
    throw new Error(error.message);
  }

  const batchRows = (data ?? []).map(normalizeBatchRow);
  const paidTotals = await getApprovedPaymentsForBatches(
    batchRows.map((row) => row.id),
  );

  const rows: PaymentQueueRow[] = batchRows.map((row) => {
    const paidTotal = paidTotals.get(row.id) ?? 0;
    const batchValue = Number(row.total_value);

    return {
      batch_id: row.id,
      batch_number: row.batch_number,
      supplier_id: row.supplier_id,
      supplier_code: row.suppliers?.supplier_code ?? "—",
      supplier_name: row.suppliers?.supplier_name ?? "—",
      product_type: row.product_type,
      batch_value: batchValue,
      paid_total: paidTotal,
      outstanding: calcOutstanding(batchValue, paidTotal),
      payment_status: row.payment_status,
      procurement_date: row.procurement_date,
    };
  });

  return { rows, total: count ?? 0 };
}

export async function getPaymentsHistory(
  page: number,
  query = "",
  statusFilter?: PaymentRecordStatus | "all",
) {
  const { authUser, role } = await requirePaymentRead();

  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let builder = supabase
    .from("supplier_payments")
    .select(PAYMENT_LIST_SELECT, { count: "exact" })
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (statusFilter && statusFilter !== "all") {
    builder = builder.eq("status", statusFilter);
  }

  if (
    role === "cash_manager" &&
    statusFilter === "pending_approval" &&
    authUser?.id
  ) {
    builder = builder.eq("recorded_by", authUser.id);
  }

  const trimmed = query.trim();
  if (trimmed) {
    const term = `%${trimmed}%`;
    builder = builder.or(
      `payment_reference.ilike.${term},notes.ilike.${term}`,
    );
  }

  const { data, error, count } = await builder;
  if (error) {
    throw new Error(error.message);
  }

  return {
    rows: await mapPaymentRows((data ?? []) as PaymentRow[]),
    total: count ?? 0,
  };
}

export async function getSuppliersWithOutstandingBatches(): Promise<
  SupplierWithOutstandingOption[]
> {
  await requirePaymentRead();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("procurement_batches")
    .select(
      `
      id,
      supplier_id,
      total_value,
      payment_status,
      suppliers ( supplier_code, supplier_name )
    `,
    )
    .eq("status", "approved")
    .in("payment_status", ["unpaid", "partially_paid"]);

  if (error) {
    throw new Error(error.message);
  }

  const batchRows = (data ?? []).map((row) => ({
    id: row.id,
    supplier_id: row.supplier_id,
    total_value: row.total_value,
    suppliers: firstRelation(
      row.suppliers as
        | { supplier_code: string; supplier_name: string }
        | { supplier_code: string; supplier_name: string }[]
        | null,
    ),
  }));

  const paidTotals = await getApprovedPaymentsForBatches(
    batchRows.map((row) => row.id),
  );

  const supplierMap = new Map<string, SupplierWithOutstandingOption>();

  for (const row of batchRows) {
    const batchValue = Number(row.total_value);
    const paidTotal = paidTotals.get(row.id) ?? 0;
    const outstanding = calcOutstanding(batchValue, paidTotal);

    if (outstanding <= 0) {
      continue;
    }

    const existing = supplierMap.get(row.supplier_id);
    if (existing) {
      existing.outstanding_total += outstanding;
      continue;
    }

    supplierMap.set(row.supplier_id, {
      id: row.supplier_id,
      supplier_code: row.suppliers?.supplier_code ?? "—",
      supplier_name: row.suppliers?.supplier_name ?? "—",
      outstanding_total: outstanding,
    });
  }

  return [...supplierMap.values()].sort((left, right) =>
    left.supplier_name.localeCompare(right.supplier_name),
  );
}

export async function getOutstandingBatchesForSupplier(
  supplierId: string,
): Promise<BatchPaymentOption[]> {
  await requirePaymentRead();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("procurement_batches")
    .select(
      "id, batch_number, product_type, total_value, payment_status, status",
    )
    .eq("supplier_id", supplierId)
    .eq("status", "approved")
    .in("payment_status", ["unpaid", "partially_paid"])
    .order("procurement_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const batchRows = data ?? [];
  const paidTotals = await getApprovedPaymentsForBatches(
    batchRows.map((row) => row.id),
  );

  return batchRows
    .map((row) => {
      const batchValue = Number(row.total_value);
      const paidTotal = paidTotals.get(row.id) ?? 0;
      const outstanding = calcOutstanding(batchValue, paidTotal);

      return {
        id: row.id,
        batch_number: row.batch_number,
        product_type: row.product_type,
        batch_value: batchValue,
        paid_total: paidTotal,
        outstanding,
        payment_status: row.payment_status as PaymentStatus,
      };
    })
    .filter((row) => row.outstanding > 0);
}

export async function getBatchPaymentSummary(
  batchId: string,
): Promise<BatchPaymentSummary | null> {
  await requirePaymentRead();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("procurement_batches")
    .select(
      `
      id,
      batch_number,
      supplier_id,
      product_type,
      total_value,
      payment_status,
      status,
      suppliers ( supplier_code, supplier_name )
    `,
    )
    .eq("id", batchId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const paidTotals = await getApprovedPaymentsForBatches([data.id]);
  const batchValue = Number(data.total_value);
  const paidTotal = paidTotals.get(data.id) ?? 0;
  const supplier = firstRelation(
    data.suppliers as
      | { supplier_code: string; supplier_name: string }
      | { supplier_code: string; supplier_name: string }[]
      | null,
  );

  return {
    batch_id: data.id,
    batch_number: data.batch_number,
    supplier_id: data.supplier_id,
    supplier_name: supplier?.supplier_name ?? "—",
    supplier_code: supplier?.supplier_code ?? "—",
    product_type: data.product_type,
    batch_value: batchValue,
    paid_total: paidTotal,
    outstanding: calcOutstanding(batchValue, paidTotal),
    payment_status: data.payment_status as PaymentStatus,
    procurement_status: data.status,
  };
}

export async function getPaymentById(
  paymentId: string,
): Promise<SupplierPaymentDetail | null> {
  await requirePaymentRead();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supplier_payments")
    .select(PAYMENT_LIST_SELECT)
    .eq("id", paymentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const row = normalizePaymentRow(data as PaymentRow);
  const nameByUserId = await loadUserNames([row.recorded_by, row.approved_by]);

  return {
    id: row.id,
    payment_reference: row.payment_reference,
    supplier_id: row.supplier_id,
    supplier_code: row.suppliers?.supplier_code ?? "—",
    supplier_name: row.suppliers?.supplier_name ?? "—",
    batch_id: row.batch_id,
    batch_number: row.procurement_batches?.batch_number ?? "—",
    product_type: row.procurement_batches?.product_type ?? "—",
    batch_value: Number(row.procurement_batches?.total_value ?? 0),
    amount: Number(row.amount),
    payment_method: row.payment_method,
    payment_date: row.payment_date,
    status: row.status,
    notes: row.notes,
    bank_account_id: row.bank_account_id,
    bank_account: row.supplier_bank_accounts,
    recorded_by_name: nameFromMap(nameByUserId, row.recorded_by),
    approved_by_name: nameFromMap(nameByUserId, row.approved_by),
    approved_at: row.approved_at,
    created_at: row.created_at,
  };
}

export async function getPaymentsForSupplier(
  supplierId: string,
): Promise<SupplierPaymentRow[]> {
  await requirePaymentRead();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supplier_payments")
    .select(PAYMENT_LIST_SELECT)
    .eq("supplier_id", supplierId)
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return mapPaymentRows((data ?? []) as PaymentRow[]);
}

export async function getSupplierOutstandingTotals(
  supplierIds: string[],
): Promise<Record<string, number>> {
  await requirePaymentRead();

  if (supplierIds.length === 0) {
    return {};
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("procurement_batches")
    .select("id, supplier_id, total_value")
    .in("supplier_id", supplierIds)
    .eq("status", "approved")
    .in("payment_status", ["unpaid", "partially_paid"]);

  if (error) {
    throw new Error(error.message);
  }

  const batchRows = data ?? [];
  const paidTotals = await getApprovedPaymentsForBatches(
    batchRows.map((row) => row.id),
  );

  const totals: Record<string, number> = {};
  for (const row of batchRows) {
    const outstanding = calcOutstanding(
      Number(row.total_value),
      paidTotals.get(row.id) ?? 0,
    );

    if (outstanding <= 0) {
      continue;
    }

    totals[row.supplier_id] = (totals[row.supplier_id] ?? 0) + outstanding;
  }

  return totals;
}

export async function getSupplierBankAccountsForPayment(
  supplierId: string,
): Promise<PaymentBankAccountSummary[]> {
  await requirePaymentRead();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supplier_bank_accounts")
    .select("id, bank_name, account_number, account_name, is_primary")
    .eq("supplier_id", supplierId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PaymentBankAccountSummary[];
}

export async function recordPayment(formData: FormData) {
  const session = await requirePaymentWrite();
  const actorUserId = requireActorUserId(session);
  const { role } = session;
  const autoApprove = role === "super_admin" || role === "admin";
  const nowIso = new Date().toISOString();

  const supplierId = String(formData.get("supplier_id") ?? "").trim();
  const batchId = String(formData.get("batch_id") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const paymentMethod = String(formData.get("payment_method") ?? "").trim();
  const bankAccountIdRaw = String(formData.get("bank_account_id") ?? "").trim();
  const paymentDate = String(formData.get("payment_date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!supplierId) {
    return { error: "Select a supplier." };
  }

  if (!batchId) {
    return { error: "Select a procurement batch." };
  }

  if (!PAYMENT_METHODS.includes(paymentMethod as PaymentMethod)) {
    return { error: "Select a valid payment method." };
  }

  const amount = Number.parseFloat(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a valid payment amount." };
  }

  const summary = await getBatchPaymentSummary(batchId);
  if (!summary) {
    return { error: "Procurement batch not found." };
  }

  if (summary.supplier_id !== supplierId) {
    return { error: "Selected batch does not belong to this supplier." };
  }

  if (summary.procurement_status !== "approved") {
    return { error: "Payments can only be recorded for approved batches." };
  }

  if (amount > summary.outstanding + 0.0001) {
    return {
      error: `Payment cannot exceed outstanding balance (${summary.outstanding.toFixed(2)}).`,
    };
  }

  const supabase = await createClient();
  const bankValidation = await validatePaymentBankAccount(
    supabase,
    supplierId,
    paymentMethod as PaymentMethod,
    bankAccountIdRaw || null,
  );

  if (bankValidation.error) {
    return { error: bankValidation.error };
  }

  const { data, error } = await supabase
    .from("supplier_payments")
    .insert({
      supplier_id: supplierId,
      batch_id: batchId,
      amount,
      payment_method: paymentMethod as PaymentMethod,
      payment_date: paymentDate || nowIso.slice(0, 10),
      notes: notes || null,
      bank_account_id: bankValidation.bankAccountId,
      recorded_by: actorUserId,
      status: autoApprove ? "approved" : "pending_approval",
      approved_by: autoApprove ? actorUserId : null,
      approved_at: autoApprove ? nowIso : null,
    })
    .select("id, status")
    .single();

  if (error) {
    if (error.message.includes("exceeds outstanding balance")) {
      return { error: "Payment amount exceeds outstanding balance." };
    }

    return { error: error.message };
  }

  revalidatePath("/payments");
  revalidatePath(`/payments/${data.id}`);
  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${supplierId}`);
  revalidatePath("/procurement");
  revalidatePath(`/procurement/${batchId}`);

  return {
    success: true,
    paymentId: data.id,
    autoApproved: data.status === "approved",
  };
}

export async function approvePayment(
  paymentId: string,
  bankAccountId?: string | null,
) {
  const session = await requirePaymentApprove();
  const actorUserId = requireActorUserId(session);

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("supplier_payments")
    .select("id, status, batch_id, supplier_id, payment_method, bank_account_id")
    .eq("id", paymentId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!existing) {
    return { error: "Payment not found." };
  }

  if (existing.status === "approved") {
    return { error: "Payment is already approved." };
  }

  const resolvedBankAccountId =
    bankAccountId !== undefined && bankAccountId !== null && bankAccountId !== ""
      ? bankAccountId
      : existing.bank_account_id;

  const bankValidation = await validatePaymentBankAccount(
    supabase,
    existing.supplier_id,
    existing.payment_method as PaymentMethod,
    resolvedBankAccountId,
  );

  if (bankValidation.error) {
    return { error: bankValidation.error };
  }

  const { data: updated, error } = await supabase
    .from("supplier_payments")
    .update({
      status: "approved",
      bank_account_id: bankValidation.bankAccountId,
      approved_by: actorUserId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", paymentId)
    .eq("status", "pending_approval")
    .select("id, status")
    .maybeSingle();

  if (error) {
    if (error.message.includes("exceeds outstanding balance")) {
      return { error: "Approving this payment would exceed the batch balance." };
    }

    return { error: error.message };
  }

  if (!updated || updated.status !== "approved") {
    return {
      error:
        "Payment could not be approved. It may already be approved or you may not have permission.",
    };
  }

  revalidatePath("/payments");
  revalidatePath(`/payments/${paymentId}`);
  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${existing.supplier_id}`);
  revalidatePath("/procurement");
  revalidatePath(`/procurement/${existing.batch_id}`);

  return { success: true };
}

export async function unlockPayment(paymentId: string) {
  await requireSuperAdmin();

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("supplier_payments")
    .select("id, status, batch_id, supplier_id")
    .eq("id", paymentId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!existing) {
    return { error: "Payment not found." };
  }

  if (existing.status !== "approved") {
    return { error: "Only approved payments can be unlocked." };
  }

  const { error } = await supabase
    .from("supplier_payments")
    .update({
      status: "pending_approval",
      approved_by: null,
      approved_at: null,
    })
    .eq("id", paymentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/payments");
  revalidatePath(`/payments/${paymentId}`);
  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${existing.supplier_id}`);
  revalidatePath("/procurement");
  revalidatePath(`/procurement/${existing.batch_id}`);

  return { success: true };
}

export async function approvePaymentAction(
  paymentId: string,
  bankAccountId?: string | null,
) {
  const result = await approvePayment(paymentId, bankAccountId);
  if (result.error) {
    throw new Error(result.error);
  }
}

export async function unlockPaymentAction(paymentId: string) {
  const result = await unlockPayment(paymentId);
  if (result.error) {
    throw new Error(result.error);
  }
}

export const getPaymentNotifications = cache(
  async (): Promise<PaymentNotifications> => {
    const actor = await getNotificationActor();
    if (!actor) {
      return EMPTY_PAYMENT_NOTIFICATIONS;
    }

    const { userId, role } = actor;

    if (!canReceivePaymentNotifications(role)) {
      return EMPTY_PAYMENT_NOTIFICATIONS;
    }

    const supabase = await createClient();
    const outstandingQuery = supabase
      .from("procurement_batches")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .in("payment_status", ["unpaid", "partially_paid"]);

    if (role === "super_admin" || role === "admin") {
      const [pendingApproval, outstandingBatches] = await Promise.all([
        supabase
          .from("supplier_payments")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending_approval"),
        outstandingQuery,
      ]);

      return {
        pendingApproval: pendingApproval.count ?? 0,
        submittedPending: 0,
        outstandingBatches: outstandingBatches.count ?? 0,
      };
    }

    const [submittedPending, outstandingBatches] = await Promise.all([
      supabase
        .from("supplier_payments")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_approval")
        .eq("recorded_by", userId),
      outstandingQuery,
    ]);

    return {
      pendingApproval: submittedPending.count ?? 0,
      submittedPending: submittedPending.count ?? 0,
      outstandingBatches: outstandingBatches.count ?? 0,
    };
  },
);

/** @deprecated Use getPaymentNotifications */
export const getPaymentPendingApprovalCount = cache(async () => {
  const notifications = await getPaymentNotifications();
  return notifications.pendingApproval;
});
