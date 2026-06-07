"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";

import {
  requireAuth,
  requireHrAdmin,
  requireProcurementApprove,
  requireProcurementRead,
  requireProcurementWrite,
  requireSuperAdmin,
  requireSupplierRead,
} from "@/lib/auth/require-role";
import { requireActorUserId } from "@/lib/auth/actor-id";
import { getNotificationActor } from "@/lib/notifications/actor";
import type { AppRole } from "@/lib/roles";
import { hasRole } from "@/lib/roles";
import { PAGE_SIZE } from "@/lib/employees/constants";
import {
  ensurePreStockFromProcurementBatch,
  removePreStockForProcurementBatch,
} from "@/lib/inventory/pre-stock-from-procurement";
import {
  MIXED_TYPES,
  PROCUREMENT_TYPES,
  PRODUCT_AGES,
  PRODUCT_COLORS,
  PRODUCT_CONDITIONS,
  QUALITY_DECISIONS,
  isStandardKgPerBag,
  type MixedType,
  type PaymentStatus,
  type ProcurementStatus,
  type ProcurementType,
  type ProductAge,
  type ProductColor,
  type ProductCondition,
  type QualityDecision,
} from "@/lib/procurement/constants";
import {
  canEditProcurementPricing,
  canSetProcurementFinalPrice,
  canViewProcurementPricing,
} from "@/lib/procurement/permissions";
import {
  buildProductType,
  calcTotalKg,
  calcTotalValue,
} from "@/lib/procurement/product-type";
import {
  isDirectTotalKgRequired,
  isKgPerBagRequired,
  isRawProduct,
} from "@/lib/procurement/quantity-rules";
import { validateQualityDecisionForProduct } from "@/lib/procurement/quality-decision-rules";
import type {
  EmployeeOption,
  ProcurementBatch,
  ProcurementListRow,
  SupplierOption,
} from "@/lib/procurement/types";
import type { ProcurementFormState } from "@/lib/procurement/form-state";
import {
  EMPTY_PROCUREMENT_NOTIFICATIONS,
  type ProcurementNotifications,
  canReceiveProcurementNotifications,
} from "@/lib/procurement/notifications";
import { canApproveProcurementStep } from "@/lib/permissions/matrix";
import { procurementStepFromStatus } from "@/lib/permissions/approval";
import { createClient } from "@/lib/supabase/server";
import { nameFromMap, resolveUserDisplayNames } from "@/lib/users/resolve-user-names";

type ProcurementInput = {
  procurement_type: ProcurementType;
  product_condition: ProductCondition;
  product_age?: ProductAge;
  product_color?: ProductColor;
  mixed_type?: MixedType;
  supplier_id: string;
  number_of_bags: number;
  kg_per_bag?: number;
  extra_kg: number;
  total_kg_direct?: number;
  unit_price: number;
  procurement_date: string;
  received_by?: string;
  quality_decision: QualityDecision;
  notes?: string;
};

function parseNumber(value: FormDataEntryValue | null): number | undefined {
  const text = String(value ?? "").trim();
  if (!text) {
    return undefined;
  }

  const parsed = Number.parseFloat(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseProcurementInput(formData: FormData): ProcurementInput {
  const product_condition = String(
    formData.get("product_condition") ?? "",
  ) as ProductCondition;
  let quality_decision = String(
    formData.get("quality_decision") ?? "",
  ).trim() as QualityDecision;

  if (isRawProduct(product_condition) && !quality_decision) {
    quality_decision = "processing";
  }

  return {
    procurement_type: String(
      formData.get("procurement_type") ?? "",
    ) as ProcurementType,
    product_condition,
    product_age: String(formData.get("product_age") ?? "").trim()
      ? (String(formData.get("product_age")) as ProductAge)
      : undefined,
    product_color: String(formData.get("product_color") ?? "").trim()
      ? (String(formData.get("product_color")) as ProductColor)
      : undefined,
    mixed_type: String(formData.get("mixed_type") ?? "").trim()
      ? (String(formData.get("mixed_type")) as MixedType)
      : undefined,
    supplier_id: String(formData.get("supplier_id") ?? "").trim(),
    number_of_bags: Number.parseInt(
      String(formData.get("number_of_bags") ?? ""),
      10,
    ),
    kg_per_bag: parseNumber(formData.get("kg_per_bag")),
    extra_kg: parseNumber(formData.get("extra_kg")) ?? 0,
    total_kg_direct: parseNumber(formData.get("total_kg_direct")),
    unit_price: parseNumber(formData.get("unit_price")) ?? 0,
    procurement_date: String(formData.get("procurement_date") ?? "").trim(),
    received_by: String(formData.get("received_by") ?? "").trim() || undefined,
    quality_decision,
    notes: String(formData.get("notes") ?? "").trim() || undefined,
  };
}

function validateProcurementInput(input: ProcurementInput): string | null {
  if (!PROCUREMENT_TYPES.includes(input.procurement_type)) {
    return "Select a valid procurement type.";
  }

  if (!PRODUCT_CONDITIONS.includes(input.product_condition)) {
    return "Select a valid product condition.";
  }

  if (input.product_condition === "mixed") {
    if (!input.mixed_type || !MIXED_TYPES.includes(input.mixed_type)) {
      return "Select a mixed product type.";
    }
  } else {
    if (!input.product_age || !PRODUCT_AGES.includes(input.product_age)) {
      return "Select new or old for non-mixed products.";
    }
    if (
      !input.product_color ||
      !PRODUCT_COLORS.includes(input.product_color)
    ) {
      return "Select red or black for non-mixed products.";
    }
  }

  if (!input.supplier_id) {
    return "Supplier is required.";
  }

  if (!Number.isFinite(input.number_of_bags) || input.number_of_bags <= 0) {
    return "Number of bags must be greater than zero.";
  }

  if (isRawProduct(input.product_condition)) {
    if (!input.total_kg_direct || input.total_kg_direct <= 0) {
      return "Total KG is required for raw products.";
    }
  } else if (isKgPerBagRequired(input.procurement_type, input.product_condition)) {
    if (!input.kg_per_bag || input.kg_per_bag <= 0) {
      return "Select package size (25 or 20 kg per bag).";
    }
    if (!isStandardKgPerBag(input.kg_per_bag)) {
      return "Package size must be 25 or 20 kg per bag.";
    }
  } else if (
    isDirectTotalKgRequired(
      input.procurement_type,
      input.product_condition,
      input.kg_per_bag,
    ) &&
    (!input.total_kg_direct || input.total_kg_direct <= 0)
  ) {
    return "Enter package size or total KG.";
  }

  if (
    !isRawProduct(input.product_condition) &&
    input.kg_per_bag != null &&
    input.kg_per_bag > 0 &&
    !isStandardKgPerBag(input.kg_per_bag)
  ) {
    return "Package size must be 25 or 20 kg per bag.";
  }

  if (!input.procurement_date) {
    return "Procurement date is required.";
  }

  if (!QUALITY_DECISIONS.includes(input.quality_decision)) {
    return "Quality decision is required.";
  }

  const qualityError = validateQualityDecisionForProduct(
    input.product_condition,
    input.quality_decision,
  );
  if (qualityError) {
    return qualityError;
  }

  const totalKg = calcTotalKg({
    procurement_type: input.procurement_type,
    product_condition: input.product_condition,
    number_of_bags: input.number_of_bags,
    kg_per_bag: input.kg_per_bag,
    extra_kg: input.extra_kg,
    total_kg_direct: input.total_kg_direct,
  });

  if (totalKg <= 0) {
    return "Total KG must be greater than zero.";
  }

  return null;
}

function toProcurementCoreRow(input: ProcurementInput) {
  const product_type = buildProductType({
    product_condition: input.product_condition,
    product_age: input.product_age,
    product_color: input.product_color,
    mixed_type: input.mixed_type,
  });

  const total_kg = calcTotalKg({
    procurement_type: input.procurement_type,
    product_condition: input.product_condition,
    number_of_bags: input.number_of_bags,
    kg_per_bag: input.kg_per_bag,
    extra_kg: input.extra_kg,
    total_kg_direct: input.total_kg_direct,
  });

  return {
    procurement_type: input.procurement_type,
    product_condition: input.product_condition,
    product_age: input.product_condition === "mixed" ? null : input.product_age,
    product_color:
      input.product_condition === "mixed" ? null : input.product_color,
    mixed_type:
      input.product_condition === "mixed" ? input.mixed_type ?? null : null,
    product_type,
    supplier_id: input.supplier_id,
    number_of_bags: input.number_of_bags,
    kg_per_bag: isRawProduct(input.product_condition)
      ? null
      : input.kg_per_bag ?? null,
    extra_kg: isRawProduct(input.product_condition) ? 0 : input.extra_kg,
    total_kg,
    procurement_date: input.procurement_date,
    received_by: input.received_by ?? null,
    quality_decision: isRawProduct(input.product_condition)
      ? "processing"
      : input.quality_decision,
    notes: input.notes ?? null,
  };
}

function toProcurementRow(
  input: ProcurementInput,
  includePricing: boolean,
) {
  const core = toProcurementCoreRow(input);
  const unit_price = includePricing ? input.unit_price : 0;
  const total_value = includePricing
    ? calcTotalValue(core.total_kg, unit_price)
    : 0;

  return {
    ...core,
    unit_price,
    total_value,
  };
}

function stripPricingForAccounts<T extends { unit_price?: number | null; total_value?: number | null }>(
  row: T,
  role: AppRole,
): T {
  if (canViewProcurementPricing(role)) {
    return row;
  }

  return {
    ...row,
    unit_price: null,
    total_value: null,
  };
}

export async function getProcurementsList(page: number, query: string) {
  const { role } = await requireProcurementRead();

  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let builder = supabase
    .from("procurement_batches")
    .select(
      `
      id,
      batch_number,
      procurement_type,
      product_condition,
      product_type,
      number_of_bags,
      kg_per_bag,
      extra_kg,
      total_kg,
      status,
      payment_status,
      procurement_date,
      supplier_id,
      unit_price,
      total_value,
      suppliers!inner(supplier_name)
    `,
      { count: "exact" },
    )
    .order("batch_number", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  const trimmed = query.trim();
  if (trimmed) {
    const term = `%${trimmed}%`;
    builder = builder.or(
      `batch_number.ilike.${term},product_type.ilike.${term}`,
    );
  }

  const { data, count, error } = await builder;

  if (error) {
    throw new Error(error.message);
  }

  const rows: ProcurementListRow[] = (data ?? []).map((row) => {
    const supplierJoin = row.suppliers as
      | { supplier_name: string }
      | { supplier_name: string }[]
      | null;
    const supplier = Array.isArray(supplierJoin)
      ? supplierJoin[0]
      : supplierJoin;
    const mapped = {
      id: row.id,
      batch_number: row.batch_number,
      procurement_type: row.procurement_type as ProcurementType,
      product_condition: row.product_condition as ProductCondition,
      product_type: row.product_type,
      number_of_bags: Number(row.number_of_bags),
      kg_per_bag:
        row.kg_per_bag != null ? Number(row.kg_per_bag) : null,
      extra_kg: Number(row.extra_kg),
      total_kg: Number(row.total_kg),
      status: row.status as ProcurementStatus,
      payment_status: row.payment_status as PaymentStatus,
      procurement_date: row.procurement_date,
      supplier_id: row.supplier_id,
      unit_price: Number(row.unit_price),
      total_value: Number(row.total_value),
      supplier_name: supplier?.supplier_name ?? "—",
    };

    return stripPricingForAccounts(mapped, role);
  });

  return { rows, total: count ?? 0 };
}

export async function getProcurementsBySupplierId(
  supplierId: string,
  limit = 25,
) {
  const { role } = await requireProcurementRead();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("procurement_batches")
    .select(
      "id, batch_number, procurement_type, product_type, total_kg, status, payment_status, procurement_date, unit_price, total_value",
    )
    .eq("supplier_id", supplierId)
    .order("batch_number", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) =>
    stripPricingForAccounts(
      {
        ...row,
        total_kg: Number(row.total_kg),
        unit_price: Number(row.unit_price),
        total_value: Number(row.total_value),
      },
      role,
    ),
  );
}

export async function getProcurementById(id: string) {
  const { role } = await requireProcurementRead();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("procurement_batches")
    .select(
      `
      id,
      batch_number,
      procurement_type,
      product_condition,
      product_age,
      product_color,
      mixed_type,
      product_type,
      supplier_id,
      number_of_bags,
      kg_per_bag,
      extra_kg,
      total_kg,
      unit_price,
      total_value,
      procurement_date,
      received_by,
      quality_decision,
      payment_status,
      status,
      notes,
      created_at,
      created_by,
      updated_at,
      approved_by,
      approved_at,
      first_approved_by,
      first_approved_at,
      suppliers(supplier_name, supplier_code)
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

  const supplierJoin = data.suppliers as
    | { supplier_name: string; supplier_code: string }
    | { supplier_name: string; supplier_code: string }[]
    | null;
  const supplier = Array.isArray(supplierJoin) ? supplierJoin[0] : supplierJoin;
  const row = data as ProcurementBatch & {
    created_by?: string | null;
    first_approved_by?: string | null;
    approved_by?: string | null;
  };
  const nameByUserId = await resolveUserDisplayNames([
    row.created_by,
    row.first_approved_by,
    row.approved_by,
  ]);

  const batch: ProcurementBatch & {
    supplier_name?: string;
    supplier_code?: string;
    created_by?: string | null;
    created_by_name?: string | null;
    first_approved_by?: string | null;
    first_approved_by_name?: string | null;
    first_approved_at?: string | null;
    approved_by_name?: string | null;
  } = stripPricingForAccounts(
    {
      ...(data as ProcurementBatch),
      total_kg: Number(data.total_kg),
      number_of_bags: Number(data.number_of_bags),
      kg_per_bag: data.kg_per_bag != null ? Number(data.kg_per_bag) : null,
      extra_kg: Number(data.extra_kg),
      unit_price: Number(data.unit_price),
      total_value: Number(data.total_value),
      supplier_name: supplier?.supplier_name,
      supplier_code: supplier?.supplier_code,
      created_by: row.created_by,
      created_by_name: nameFromMap(nameByUserId, row.created_by),
      first_approved_by: row.first_approved_by,
      first_approved_by_name: nameFromMap(nameByUserId, row.first_approved_by),
      first_approved_at: (data as { first_approved_at?: string | null })
        .first_approved_at,
      approved_by_name: nameFromMap(nameByUserId, row.approved_by),
    },
    role,
  );

  return batch;
}

export async function getActiveSuppliersForSelect(): Promise<SupplierOption[]> {
  await requireProcurementRead();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, supplier_code, supplier_name")
    .eq("status", "active")
    .order("supplier_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getActiveEmployeesForSelect(): Promise<EmployeeOption[]> {
  const { role } = await requireAuth();

  const canUseEmployeePicker = hasRole(role, [
    "super_admin",
    "admin",
    "warehouse_manager",
    "logistics_manager",
  ]);

  if (!canUseEmployeePicker) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, employee_code, first_name, last_name")
    .eq("status", "active")
    .order("first_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((employee) => ({
    id: employee.id,
    employee_code: employee.employee_code,
    label: `${employee.first_name} ${employee.last_name} (${employee.employee_code})`,
  }));
}

export async function createProcurement(
  _prev: ProcurementFormState,
  formData: FormData,
): Promise<ProcurementFormState> {
  const { role, authUser } = await requireProcurementWrite();

  const input = parseProcurementInput(formData);
  const validationError = validateProcurementInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const includePricing = canEditProcurementPricing(role);

  const { data: batchNumber, error: codeError } = await supabase.rpc(
    "generate_procurement_batch_number",
  );

  if (codeError || !batchNumber) {
    return {
      error:
        codeError?.message ??
        "Could not generate batch number. Run migration 00007 in Supabase.",
    };
  }

  const { data, error } = await supabase
    .from("procurement_batches")
    .insert({
      ...toProcurementRow(input, includePricing),
      batch_number: batchNumber,
      created_by: authUser?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create procurement batch." };
  }

  const { error: syncError } = await supabase.rpc("sync_supplier_inactivity");
  if (syncError) {
    console.error("sync_supplier_inactivity:", syncError.message);
  }

  revalidatePath("/procurement");
  revalidatePath("/suppliers");
  revalidatePath("/dashboard", "layout");
  return { success: true, batchId: data.id };
}

export async function updateProcurement(
  batchId: string,
  _prev: ProcurementFormState,
  formData: FormData,
): Promise<ProcurementFormState> {
  const { role } = await requireProcurementWrite();

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("procurement_batches")
    .select("status")
    .eq("id", batchId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!existing) {
    return { error: "Procurement batch not found." };
  }

  if (existing.status === "approved") {
    return {
      error:
        "This batch is approved and locked. Super admin must unlock before editing.",
    };
  }

  const input = parseProcurementInput(formData);
  const validationError = validateProcurementInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const includePricing = canEditProcurementPricing(role);
  const core = toProcurementCoreRow(input);
  const row = includePricing
    ? {
        ...core,
        unit_price: input.unit_price,
        total_value: calcTotalValue(core.total_kg, input.unit_price),
      }
    : core;

  const { error } = await supabase
    .from("procurement_batches")
    .update(row)
    .eq("id", batchId);

  if (error) {
    return { error: error.message };
  }

  const { error: syncError } = await supabase.rpc("sync_supplier_inactivity");
  if (syncError) {
    console.error("sync_supplier_inactivity:", syncError.message);
  }

  revalidatePath("/procurement");
  revalidatePath(`/procurement/${batchId}`);
  revalidatePath("/expenses");
  revalidatePath("/expenses/operational");
  revalidatePath("/suppliers");
  revalidatePath("/dashboard", "layout");
  return { success: true, batchId };
}

export async function updateProcurementUnitPrice(
  batchId: string,
  _prev: ProcurementFormState,
  formData: FormData,
): Promise<ProcurementFormState> {
  const { role } = await requireHrAdmin();

  const unitPrice = parseNumber(formData.get("unit_price"));
  if (!unitPrice || unitPrice <= 0) {
    return { error: "Enter a valid unit price greater than zero." };
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("procurement_batches")
    .select("status, total_kg")
    .eq("id", batchId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!existing) {
    return { error: "Procurement batch not found." };
  }

  const status = existing.status as ProcurementStatus;
  if (!canSetProcurementFinalPrice(role, status)) {
    return {
      error: "Unit price can only be set while awaiting admin final approval.",
    };
  }

  const totalKg = Number(existing.total_kg);
  const { error } = await supabase
    .from("procurement_batches")
    .update({
      unit_price: unitPrice,
      total_value: calcTotalValue(totalKg, unitPrice),
    })
    .eq("id", batchId)
    .eq("status", status);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/procurement");
  revalidatePath(`/procurement/${batchId}`);
  revalidatePath("/expenses");
  revalidatePath("/expenses/operational");
  revalidatePath("/suppliers");
  revalidatePath("/dashboard", "layout");
  return { success: true, batchId };
}

export async function approveProcurement(batchId: string) {
  const session = await requireProcurementApprove();
  const actorUserId = requireActorUserId(session);
  const { role } = session;

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("procurement_batches")
    .select(
      `
      status,
      unit_price,
      product_condition,
      quality_decision,
      product_type,
      number_of_bags,
      total_kg,
      procurement_date,
      created_by,
      first_approved_by,
      second_approved_by
    `,
    )
    .eq("id", batchId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!existing) {
    throw new Error("Procurement batch not found.");
  }

  const status = existing.status as ProcurementStatus;

  if (status === "approved") {
    throw new Error("This batch is already approved.");
  }

  if (status === "rejected") {
    throw new Error("This batch was rejected.");
  }

  const step = procurementStepFromStatus(status);
  if (!step) {
    throw new Error("This batch is not awaiting approval.");
  }

  if (!canApproveProcurementStep(role, step)) {
    throw new Error("You are not allowed to approve at this step.");
  }

  if (step === "first") {
    if (existing.created_by === actorUserId) {
      throw new Error("You cannot approve your own submission.");
    }

    const { error } = await supabase
      .from("procurement_batches")
      .update({
        status: "pending_admin_approval" as ProcurementStatus,
        first_approved_by: actorUserId,
        first_approved_at: new Date().toISOString(),
      })
      .eq("id", batchId)
      .eq("status", status);

    if (error) {
      throw new Error(error.message);
    }
  } else if (step === "second") {
    if (
      existing.created_by === actorUserId ||
      existing.first_approved_by === actorUserId
    ) {
      throw new Error("A different reviewer must complete the second approval.");
    }

    const { error } = await supabase
      .from("procurement_batches")
      .update({
        status: "pending_admin_approval" as ProcurementStatus,
        second_approved_by: actorUserId,
        second_approved_at: new Date().toISOString(),
      })
      .eq("id", batchId)
      .eq("status", status);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    if (Number(existing.unit_price) <= 0) {
      throw new Error("Set a unit price before final approval.");
    }

    const qualityError = validateQualityDecisionForProduct(
      existing.product_condition as ProductCondition,
      existing.quality_decision as QualityDecision,
    );
    if (qualityError) {
      throw new Error(qualityError);
    }

    const { error } = await supabase
      .from("procurement_batches")
      .update({
        status: "approved" as ProcurementStatus,
        approved_by: actorUserId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", batchId)
      .eq("status", status);

    if (error) {
      throw new Error(error.message);
    }

    const preStockResult = await ensurePreStockFromProcurementBatch(supabase, {
      id: batchId,
      quality_decision: existing.quality_decision,
      product_type: existing.product_type,
      number_of_bags: Number(existing.number_of_bags),
      total_kg: Number(existing.total_kg),
      procurement_date: existing.procurement_date,
    });

    if (preStockResult.error) {
      await supabase
        .from("procurement_batches")
        .update({
          status: "pending_admin_approval" as ProcurementStatus,
          approved_by: null,
          approved_at: null,
        })
        .eq("id", batchId);
      throw new Error(preStockResult.error);
    }
  }

  revalidatePath("/procurement");
  revalidatePath(`/procurement/${batchId}`);
  revalidatePath("/inventory");
  revalidatePath("/inventory/pre-stock");
  revalidatePath("/inventory/export");
  revalidatePath("/dashboard", "layout");
}

export async function unlockProcurement(batchId: string) {
  await requireSuperAdmin();

  const supabase = await createClient();

  const preStockRemoval = await removePreStockForProcurementBatch(
    supabase,
    batchId,
  );
  if (preStockRemoval.error) {
    throw new Error(preStockRemoval.error);
  }

  const { error } = await supabase
    .from("procurement_batches")
    .update({
      status: "pending_approval" as ProcurementStatus,
      approved_by: null,
      approved_at: null,
      first_approved_by: null,
      first_approved_at: null,
      second_approved_by: null,
      second_approved_at: null,
      rejected_by: null,
      rejected_at: null,
    })
    .eq("id", batchId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/procurement");
  revalidatePath(`/procurement/${batchId}`);
  revalidatePath("/inventory");
  revalidatePath("/inventory/pre-stock");
  revalidatePath("/inventory/export");
  revalidatePath("/dashboard", "layout");
}

export async function approveProcurementAction(batchId: string) {
  await approveProcurement(batchId);
}

export async function unlockProcurementAction(batchId: string) {
  await unlockProcurement(batchId);
}

export async function getSupplierProcurementCounts(
  supplierIds: string[],
): Promise<Record<string, number>> {
  if (supplierIds.length === 0) {
    return {};
  }

  await requireSupplierRead();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("procurement_batches")
    .select("supplier_id")
    .in("supplier_id", supplierIds);

  if (error) {
    throw new Error(error.message);
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.supplier_id] = (counts[row.supplier_id] ?? 0) + 1;
  }

  return counts;
}

export const getProcurementNotifications = cache(
  async (): Promise<ProcurementNotifications> => {
    const actor = await getNotificationActor();
    if (!actor) {
      return EMPTY_PROCUREMENT_NOTIFICATIONS;
    }

    const { userId, role } = actor;

    if (!canReceiveProcurementNotifications(role)) {
      return EMPTY_PROCUREMENT_NOTIFICATIONS;
    }

    const supabase = await createClient();

    const awaitingConfirmationFilter =
      "status.eq.pending_approval,status.eq.pending_second_approval";

    if (role === "super_admin" || role === "admin") {
      const [awaitingConfirmation, finalResult, needsPriceResult] =
        await Promise.all([
          supabase
            .from("procurement_batches")
            .select("id", { count: "exact", head: true })
            .or(awaitingConfirmationFilter),
          supabase
            .from("procurement_batches")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending_admin_approval"),
          supabase
            .from("procurement_batches")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending_admin_approval")
            .lte("unit_price", 0),
        ]);

      if (
        awaitingConfirmation.error ||
        finalResult.error ||
        needsPriceResult.error
      ) {
        return EMPTY_PROCUREMENT_NOTIFICATIONS;
      }

      const awaitingFinal = finalResult.count ?? 0;
      const needsPrice = needsPriceResult.count ?? 0;

      return {
        urgentCount: Math.max(0, awaitingFinal - needsPrice),
        awarenessCount: awaitingConfirmation.count ?? 0,
        needsPrice,
        submittedPending: 0,
      };
    }

    if (role === "cash_manager" || role === "logistics_manager") {
      const [toConfirm, confirmedByMe] = await Promise.all([
        supabase
          .from("procurement_batches")
          .select("id", { count: "exact", head: true })
          .or(awaitingConfirmationFilter),
        supabase
          .from("procurement_batches")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending_admin_approval")
          .eq("first_approved_by", userId),
      ]);

      if (toConfirm.error || confirmedByMe.error) {
        return EMPTY_PROCUREMENT_NOTIFICATIONS;
      }

      return {
        urgentCount: toConfirm.count ?? 0,
        awarenessCount: confirmedByMe.count ?? 0,
        needsPrice: 0,
        submittedPending: 0,
      };
    }

    const [submittedPending, withAdmin] = await Promise.all([
      supabase
        .from("procurement_batches")
        .select("id", { count: "exact", head: true })
        .or(awaitingConfirmationFilter)
        .eq("created_by", userId),
      supabase
        .from("procurement_batches")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_admin_approval")
        .eq("created_by", userId),
    ]);

    if (submittedPending.error || withAdmin.error) {
      return EMPTY_PROCUREMENT_NOTIFICATIONS;
    }

    return {
      urgentCount: 0,
      awarenessCount: withAdmin.count ?? 0,
      needsPrice: 0,
      submittedPending: submittedPending.count ?? 0,
    };
  },
);

/** @deprecated Use getProcurementNotifications */
export const getProcurementAdminNotifications = getProcurementNotifications;

/** @deprecated Use getProcurementNotifications */
export async function getPendingProcurementApprovalCount(): Promise<number> {
  const notifications = await getProcurementNotifications();
  return notifications.urgentCount;
}
