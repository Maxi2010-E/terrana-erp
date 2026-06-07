"use server";

import { revalidatePath } from "next/cache";

import {
  requireInventoryRead,
  requireInventoryWrite,
  requireLogisticsRead,
} from "@/lib/auth/require-role";
import { PAGE_SIZE } from "@/lib/employees/constants";
import type {
  WarehouseLotBatchRow,
  WarehouseLotDetail,
  WarehouseLotListRow,
  WarehouseLotOption,
} from "@/lib/inventory/types";
import type { WarehouseLotLoadOption } from "@/lib/logistics/types";
import { revalidateInventoryNotificationSurfaces } from "@/lib/actions/inventory";
import { createClient } from "@/lib/supabase/server";

export type WarehouseLotFormState = {
  error?: string;
  success?: boolean;
  lotId?: string;
};

type LotInput = {
  label: string;
  location_notes?: string;
  stacked_date?: string;
};

function parseLotInput(formData: FormData): LotInput {
  return {
    label: String(formData.get("label") ?? "").trim(),
    location_notes:
      String(formData.get("location_notes") ?? "").trim() || undefined,
    stacked_date:
      String(formData.get("stacked_date") ?? "").trim() || undefined,
  };
}

function validateLotInput(input: LotInput): string | null {
  if (!input.label) {
    return "Lot label is required.";
  }
  return null;
}

function toLotRow(input: LotInput) {
  return {
    label: input.label,
    location_notes: input.location_notes ?? null,
    stacked_date: input.stacked_date ?? null,
  };
}

export async function getWarehouseLotsList(page: number, query: string) {
  await requireInventoryRead();

  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let builder = supabase
    .from("warehouse_lots")
    .select("id, lot_code, label, stacked_date", { count: "exact" })
    .order("label", { ascending: true })
    .range(from, to);

  const trimmed = query.trim();
  if (trimmed) {
    const term = `%${trimmed}%`;
    builder = builder.or(
      `label.ilike.${term},lot_code.ilike.${term},location_notes.ilike.${term}`,
    );
  }

  const { data, count, error } = await builder;

  if (error) {
    throw new Error(error.message);
  }

  const lotIds = (data ?? []).map((row) => row.id);
  const batchTotals = new Map<
    string,
    { batch_count: number; bags_on_hand: number }
  >();

  if (lotIds.length > 0) {
    const { data: batches, error: batchError } = await supabase
      .from("inventory_batches")
      .select("warehouse_lot_id, bags")
      .in("warehouse_lot_id", lotIds)
      .eq("status", "available")
      .gt("bags", 0);

    if (batchError) {
      throw new Error(batchError.message);
    }

    for (const batch of batches ?? []) {
      if (!batch.warehouse_lot_id) {
        continue;
      }
      const current = batchTotals.get(batch.warehouse_lot_id) ?? {
        batch_count: 0,
        bags_on_hand: 0,
      };
      current.batch_count += 1;
      current.bags_on_hand += Number(batch.bags);
      batchTotals.set(batch.warehouse_lot_id, current);
    }
  }

  const rows: WarehouseLotListRow[] = (data ?? []).map((row) => {
    const totals = batchTotals.get(row.id);
    return {
      id: row.id,
      lot_code: row.lot_code,
      label: row.label,
      stacked_date: row.stacked_date,
      batch_count: totals?.batch_count ?? 0,
      bags_on_hand: totals?.bags_on_hand ?? 0,
    };
  });

  return { rows, total: count ?? 0 };
}

export async function getWarehouseLotById(
  id: string,
): Promise<WarehouseLotDetail | null> {
  await requireInventoryRead();

  const supabase = await createClient();
  const { data: lot, error } = await supabase
    .from("warehouse_lots")
    .select(
      "id, lot_code, label, location_notes, stacked_date, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!lot) {
    return null;
  }

  const { data: batches, error: batchError } = await supabase
    .from("inventory_batches")
    .select(
      "id, inventory_number, product_type, bags, total_kg, date_graded, status",
    )
    .eq("warehouse_lot_id", id)
    .order("date_graded", { ascending: false })
    .order("inventory_number", { ascending: false });

  if (batchError) {
    throw new Error(batchError.message);
  }

  const mappedBatches: WarehouseLotBatchRow[] = (batches ?? []).map((row) => ({
    id: row.id,
    inventory_number: row.inventory_number,
    product_type: row.product_type,
    bags: Number(row.bags),
    total_kg: Number(row.total_kg),
    date_graded: row.date_graded,
    status: row.status as WarehouseLotBatchRow["status"],
  }));

  return {
    id: lot.id,
    lot_code: lot.lot_code,
    label: lot.label,
    location_notes: lot.location_notes,
    stacked_date: lot.stacked_date,
    created_at: lot.created_at,
    updated_at: lot.updated_at,
    batches: mappedBatches,
  };
}

export async function getWarehouseLotsForAssignPicker(): Promise<
  WarehouseLotOption[]
> {
  await requireInventoryRead();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("warehouse_lots")
    .select("id, lot_code, label")
    .order("label", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as WarehouseLotOption[];
}

export async function getWarehouseLotsForShipmentSelect() {
  await requireLogisticsRead();

  const supabase = await createClient();
  const { data: lots, error } = await supabase
    .from("warehouse_lots")
    .select("id, lot_code, label")
    .order("label", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const lotIds = (lots ?? []).map((lot) => lot.id);
  const bagsByLot = new Map<string, number>();

  if (lotIds.length > 0) {
    const { data: batches, error: batchError } = await supabase
      .from("inventory_batches")
      .select("warehouse_lot_id, bags")
      .in("warehouse_lot_id", lotIds)
      .eq("status", "available")
      .gt("bags", 0);

    if (batchError) {
      throw new Error(batchError.message);
    }

    for (const batch of batches ?? []) {
      if (!batch.warehouse_lot_id) {
        continue;
      }
      bagsByLot.set(
        batch.warehouse_lot_id,
        (bagsByLot.get(batch.warehouse_lot_id) ?? 0) + Number(batch.bags),
      );
    }
  }

  return (lots ?? [])
    .map((lot) => ({
      id: lot.id,
      lot_code: lot.lot_code,
      label: lot.label,
      bags_on_hand: bagsByLot.get(lot.id) ?? 0,
    }))
    .filter((lot) => lot.bags_on_hand > 0);
}

export async function getWarehouseLotLoadOptions(
  lotId: string,
): Promise<WarehouseLotLoadOption[]> {
  await requireLogisticsRead();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_batches")
    .select("id, inventory_number, product_type, bags, total_kg")
    .eq("warehouse_lot_id", lotId)
    .eq("status", "available")
    .gt("bags", 0)
    .order("inventory_number", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    inventory_number: row.inventory_number,
    product_type: row.product_type,
    bags: Number(row.bags),
    total_kg: Number(row.total_kg),
  }));
}

export async function createWarehouseLot(
  _prev: WarehouseLotFormState,
  formData: FormData,
): Promise<WarehouseLotFormState> {
  await requireInventoryWrite();

  const input = parseLotInput(formData);
  const validationError = validateLotInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("warehouse_lots")
    .insert(toLotRow(input))
    .select("id")
    .single();

  if (error || !data) {
    return {
      error:
        error?.message ??
        "Could not create warehouse lot. Run migration 00045 in Supabase.",
    };
  }

  revalidatePath("/inventory");
  revalidatePath("/inventory/warehouse-lots");
  revalidatePath("/inventory/export");
  return { success: true, lotId: data.id };
}

export async function updateWarehouseLot(
  lotId: string,
  _prev: WarehouseLotFormState,
  formData: FormData,
): Promise<WarehouseLotFormState> {
  await requireInventoryWrite();

  const input = parseLotInput(formData);
  const validationError = validateLotInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("warehouse_lots")
    .update(toLotRow(input))
    .eq("id", lotId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/inventory/warehouse-lots");
  revalidatePath(`/inventory/warehouse-lots/${lotId}`);
  revalidatePath("/inventory/export");
  return { success: true, lotId };
}

export async function assignInventoryToWarehouseLot(
  batchId: string,
  warehouseLotId: string | null,
): Promise<{ error?: string; success?: boolean }> {
  await requireInventoryWrite();

  const supabase = await createClient();

  if (warehouseLotId) {
    const { data: lot, error: lotError } = await supabase
      .from("warehouse_lots")
      .select("id")
      .eq("id", warehouseLotId)
      .maybeSingle();

    if (lotError) {
      return { error: lotError.message };
    }
    if (!lot) {
      return { error: "Warehouse lot not found." };
    }
  }

  const { data: batch, error: batchError } = await supabase
    .from("inventory_batches")
    .select("id, status, bags")
    .eq("id", batchId)
    .maybeSingle();

  if (batchError) {
    return { error: batchError.message };
  }
  if (!batch) {
    return { error: "Inventory batch not found." };
  }
  if (batch.status !== "available") {
    return {
      error: "Only available inventory can be assigned to a warehouse lot.",
    };
  }

  const { error } = await supabase
    .from("inventory_batches")
    .update({ warehouse_lot_id: warehouseLotId })
    .eq("id", batchId);

  if (error) {
    return { error: error.message };
  }

  await revalidateInventoryNotificationSurfaces(
    "/inventory",
    "/inventory/export",
    "/inventory/warehouse-lots",
  );
  if (warehouseLotId) {
    revalidatePath(`/inventory/warehouse-lots/${warehouseLotId}`);
  }
  return { success: true };
}
