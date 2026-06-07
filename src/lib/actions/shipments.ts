"use server";

import { revalidatePath } from "next/cache";

import { requireActorUserId } from "@/lib/auth/actor-id";
import {
  requireExpenseRead,
  requireLogisticsRead,
  requireLogisticsWrite,
} from "@/lib/auth/require-role";
import { PAGE_SIZE } from "@/lib/employees/constants";
import {
  SHIPMENT_STATUSES,
  type ShipmentStatus,
} from "@/lib/logistics/constants";
import { kgForBagLoad } from "@/lib/inventory/warehouse-lot";
import type {
  AvailableInventoryOption,
  CostAllocationListRow,
  Shipment,
  ShipmentInventoryLine,
  ShipmentListRow,
} from "@/lib/logistics/types";
import { createClient } from "@/lib/supabase/server";

export type ShipmentFormState = {
  error?: string;
  success?: boolean;
  shipmentId?: string;
};

type ShipmentRowDb = {
  id: string;
  shipment_number: string;
  customer_id: string;
  truck_agent_id: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  truck_plate_number: string | null;
  container_number: string;
  seal_number: string;
  destination_port: string | null;
  total_kg: number;
  loading_date: string;
  bill_of_lading: string | null;
  vessel_name: string | null;
  vessel_number: string | null;
  status: ShipmentStatus;
  notes: string | null;
  created_at: string;
  customers:
    | { customer_name: string; customer_code: string }
    | { customer_name: string; customer_code: string }[]
    | null;
  truck_agents:
    | { agent_name: string }
    | { agent_name: string }[]
    | null;
};

function joinOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getShipmentsList(
  page: number,
  query: string,
  status?: ShipmentStatus,
) {
  await requireLogisticsRead();

  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let builder = supabase
    .from("shipments")
    .select(
      `
      id,
      shipment_number,
      container_number,
      seal_number,
      total_kg,
      loading_date,
      status,
      customers(customer_name)
    `,
      { count: "exact" },
    )
    .order("loading_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) {
    builder = builder.eq("status", status);
  }

  const trimmed = query.trim();
  if (trimmed) {
    const term = `%${trimmed}%`;
    builder = builder.or(
      `shipment_number.ilike.${term},container_number.ilike.${term},seal_number.ilike.${term}`,
    );
  }

  const { data, count, error } = await builder;

  if (error) {
    throw new Error(error.message);
  }

  const rows: ShipmentListRow[] = (data ?? []).map((row) => {
    const customer = joinOne(
      row.customers as ShipmentRowDb["customers"],
    );
    return {
      id: row.id,
      shipment_number: row.shipment_number,
      customer_name: customer?.customer_name ?? "—",
      container_number: row.container_number,
      seal_number: row.seal_number,
      total_kg: Number(row.total_kg),
      loading_date: row.loading_date,
      status: row.status as ShipmentStatus,
    };
  });

  return { rows, total: count ?? 0 };
}

export async function getCostAllocationList(page: number, query: string) {
  await requireLogisticsRead();

  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let builder = supabase
    .from("shipment_lot_loads")
    .select(
      `
      id,
      bags,
      total_kg,
      inventory_batches(inventory_number, product_type),
      shipments(
        id,
        shipment_number,
        loading_date,
        customers(customer_name)
      )
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  const { data, count, error } = await builder;

  if (error) {
    throw new Error(error.message);
  }

  const rows: CostAllocationListRow[] = (data ?? []).flatMap((row) => {
    const shipment = joinOne(
      row.shipments as
        | {
            id: string;
            shipment_number: string;
            loading_date: string;
            customers:
              | { customer_name: string }
              | { customer_name: string }[]
              | null;
          }
        | {
            id: string;
            shipment_number: string;
            loading_date: string;
            customers:
              | { customer_name: string }
              | { customer_name: string }[]
              | null;
          }[]
        | null,
    );
    const inventory = joinOne(
      row.inventory_batches as
        | { inventory_number: string; product_type: string }
        | { inventory_number: string; product_type: string }[]
        | null,
    );

    if (!shipment || !inventory) {
      return [];
    }

    const customer = joinOne(shipment.customers);

    return [
      {
        id: row.id as string,
        shipmentId: shipment.id,
        shipmentNumber: shipment.shipment_number,
        customerName: customer?.customer_name ?? "—",
        inventoryNumber: inventory.inventory_number,
        productType: inventory.product_type,
        bags: Number(row.bags),
        totalKg: Number(row.total_kg),
        loadingDate: shipment.loading_date,
      },
    ];
  });

  return { rows, total: count ?? 0 };
}

export async function getShipmentDashboardCounts() {
  await requireLogisticsRead();

  const supabase = await createClient();
  const statuses: ShipmentStatus[] = ["loaded", "in_transit", "delivered"];

  const results = await Promise.all(
    statuses.map(async (status) => {
      const { count, error } = await supabase
        .from("shipments")
        .select("id", { count: "exact", head: true })
        .eq("status", status);

      if (error) {
        throw new Error(error.message);
      }

      return [status, count ?? 0] as const;
    }),
  );

  return Object.fromEntries(results) as Record<ShipmentStatus, number>;
}

export async function getAvailableInventoryForShipment(): Promise<
  AvailableInventoryOption[]
> {
  await requireLogisticsRead();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_batches")
    .select("id, inventory_number, product_type, bags, total_kg")
    .eq("status", "available")
    .order("date_graded", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    inventory_number: row.inventory_number,
    product_type: row.product_type,
    bags: row.bags,
    total_kg: Number(row.total_kg),
  }));
}

export async function getShipmentsForExpenseLink(): Promise<
  import("@/lib/expenses/types").ShipmentExpenseLinkOption[]
> {
  await requireExpenseRead();

  const supabase = await createClient();
  const { data: linkedExpenseRows, error: linkedError } = await supabase
    .from("operational_expenses")
    .select("shipment_id")
    .eq("expense_type", "warehouse_loading")
    .in("status", ["pending_approval", "approved", "payment_made"])
    .not("shipment_id", "is", null);

  if (linkedError) {
    throw new Error(linkedError.message);
  }

  const linkedIds = new Set(
    (linkedExpenseRows ?? [])
      .map((row) => row.shipment_id)
      .filter((id): id is string => Boolean(id)),
  );

  const { data, error } = await supabase
    .from("shipments")
    .select(
      `
      id,
      shipment_number,
      container_number,
      loading_date,
      status,
      shipment_lot_loads(bags),
      shipment_inventory(bags)
    `,
    )
    .in("status", ["loaded", "in_transit"])
    .order("loading_date", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .filter((row) => !linkedIds.has(row.id))
    .map((row) => {
      const lotLines = Array.isArray(row.shipment_lot_loads)
        ? row.shipment_lot_loads
        : row.shipment_lot_loads
          ? [row.shipment_lot_loads]
          : [];
      const legacyLines = Array.isArray(row.shipment_inventory)
        ? row.shipment_inventory
        : row.shipment_inventory
          ? [row.shipment_inventory]
          : [];
      const lines = lotLines.length > 0 ? lotLines : legacyLines;
      const bags = lines.reduce(
        (sum, line) => sum + Number(line.bags ?? 0),
        0,
      );

      return {
        id: row.id,
        label: `${row.shipment_number} · ${row.container_number}`,
        href: `/logistics/shipments/${row.id}`,
        bags,
      };
    })
    .filter((row) => row.bags > 0);
}

export async function getShipmentById(id: string): Promise<Shipment | null> {
  await requireLogisticsRead();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shipments")
    .select(
      `
      id,
      shipment_number,
      customer_id,
      truck_agent_id,
      driver_name,
      driver_phone,
      truck_plate_number,
      container_number,
      seal_number,
      destination_port,
      total_kg,
      loading_date,
      bill_of_lading,
      vessel_name,
      vessel_number,
      status,
      notes,
      created_at,
      customers(customer_name, customer_code),
      truck_agents(agent_name)
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

  const row = data as ShipmentRowDb;
  const customer = joinOne(row.customers);
  const truckAgent = joinOne(row.truck_agents);

  const { data: lotLines, error: lotLinesError } = await supabase
    .from("shipment_lot_loads")
    .select(
      `
      id,
      inventory_batch_id,
      bags,
      total_kg,
      inventory_batches(inventory_number, product_type),
      warehouse_lots(label)
    `,
    )
    .eq("shipment_id", id)
    .order("created_at", { ascending: true });

  if (lotLinesError) {
    throw new Error(lotLinesError.message);
  }

  let mappedLines: ShipmentInventoryLine[] = (lotLines ?? []).map((line) => {
    const batch = joinOne(
      line.inventory_batches as
        | { inventory_number: string; product_type: string }
        | { inventory_number: string; product_type: string }[]
        | null,
    );
    const lot = joinOne(
      line.warehouse_lots as { label: string } | { label: string }[] | null,
    );
    return {
      id: line.id,
      inventory_batch_id: line.inventory_batch_id,
      inventory_number: batch?.inventory_number ?? "—",
      product_type: batch?.product_type ?? "—",
      bags: line.bags,
      total_kg: Number(line.total_kg),
      warehouse_lot_label: lot?.label ?? null,
    };
  });

  if (mappedLines.length === 0) {
    const { data: inventoryLines, error: linesError } = await supabase
      .from("shipment_inventory")
      .select(
        `
        id,
        inventory_batch_id,
        bags,
        total_kg,
        inventory_batches(inventory_number, product_type)
      `,
      )
      .eq("shipment_id", id)
      .order("created_at", { ascending: true });

    if (linesError) {
      throw new Error(linesError.message);
    }

    mappedLines = (inventoryLines ?? []).map((line) => {
      const batch = joinOne(
        line.inventory_batches as
          | { inventory_number: string; product_type: string }
          | { inventory_number: string; product_type: string }[]
          | null,
      );
      return {
        id: line.id,
        inventory_batch_id: line.inventory_batch_id,
        inventory_number: batch?.inventory_number ?? "—",
        product_type: batch?.product_type ?? "—",
        bags: line.bags,
        total_kg: Number(line.total_kg),
      };
    });
  }

  return {
    id: row.id,
    shipment_number: row.shipment_number,
    customer_id: row.customer_id,
    customer_name: customer?.customer_name ?? "—",
    customer_code: customer?.customer_code ?? "—",
    truck_agent_id: row.truck_agent_id,
    truck_agent_name: truckAgent?.agent_name ?? null,
    driver_name: row.driver_name,
    driver_phone: row.driver_phone,
    truck_plate_number: row.truck_plate_number,
    container_number: row.container_number,
    seal_number: row.seal_number,
    destination_port: row.destination_port,
    total_kg: Number(row.total_kg),
    loading_date: row.loading_date,
    bill_of_lading: row.bill_of_lading,
    vessel_name: row.vessel_name,
    vessel_number: row.vessel_number,
    status: row.status,
    notes: row.notes,
    created_at: row.created_at,
    inventory_lines: mappedLines,
  };
}

export async function createShipment(
  _prev: ShipmentFormState,
  formData: FormData,
): Promise<ShipmentFormState> {
  const session = await requireLogisticsWrite();
  const actorUserId = requireActorUserId(session);

  const customerId = String(formData.get("customer_id") ?? "").trim();
  const truckAgentId =
    String(formData.get("truck_agent_id") ?? "").trim() || null;
  const driverName =
    String(formData.get("driver_name") ?? "").trim() || null;
  const driverPhone =
    String(formData.get("driver_phone") ?? "").trim() || null;
  const truckPlate =
    String(formData.get("truck_plate_number") ?? "").trim() || null;
  const containerNumber = String(formData.get("container_number") ?? "").trim();
  const sealNumber = String(formData.get("seal_number") ?? "").trim();
  const destinationPort =
    String(formData.get("destination_port") ?? "").trim() || null;
  const loadingDate = String(formData.get("loading_date") ?? "").trim();
  const billOfLading =
    String(formData.get("bill_of_lading") ?? "").trim() || null;
  const vesselName = String(formData.get("vessel_name") ?? "").trim() || null;
  const vesselNumber =
    String(formData.get("vessel_number") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const warehouseLotId = String(formData.get("warehouse_lot_id") ?? "").trim();
  const loadBatchIds = formData.getAll("load_batch_id").map(String);
  const loadBagsRaw = formData.getAll("load_bags").map(String);

  if (!customerId) {
    return { error: "Select a customer." };
  }
  if (!containerNumber) {
    return { error: "Container number is required." };
  }
  if (!sealNumber) {
    return { error: "Seal number is required." };
  }
  if (!warehouseLotId) {
    return { error: "Select a warehouse lot to load from." };
  }

  const loadLines: { batchId: string; bags: number }[] = [];
  for (let i = 0; i < loadBatchIds.length; i += 1) {
    const batchId = loadBatchIds[i]?.trim();
    const bags = Number.parseInt(loadBagsRaw[i] ?? "0", 10);
    if (!batchId || !Number.isFinite(bags) || bags <= 0) {
      continue;
    }
    loadLines.push({ batchId, bags });
  }

  if (loadLines.length === 0) {
    return { error: "Enter bags to load for at least one inventory batch." };
  }

  const supabase = await createClient();

  const batchIds = loadLines.map((line) => line.batchId);
  const { data: batches, error: batchError } = await supabase
    .from("inventory_batches")
    .select("id, bags, total_kg, status, warehouse_lot_id")
    .in("id", batchIds);

  if (batchError) {
    return { error: batchError.message };
  }

  if ((batches ?? []).length !== batchIds.length) {
    return { error: "One or more inventory batches were not found." };
  }

  const batchById = new Map((batches ?? []).map((batch) => [batch.id, batch]));

  let totalKg = 0;
  for (const line of loadLines) {
    const batch = batchById.get(line.batchId);
    if (!batch) {
      return { error: "One or more inventory batches were not found." };
    }
    if (batch.status !== "available") {
      return {
        error: "One or more selected inventory batches are no longer available.",
      };
    }
    if (batch.warehouse_lot_id !== warehouseLotId) {
      return {
        error: "All selected inventory must belong to the chosen warehouse lot.",
      };
    }
    if (line.bags > batch.bags) {
      return {
        error: `Load exceeds bags remaining on ${batch.id}.`,
      };
    }
    totalKg += kgForBagLoad(
      Number(batch.bags),
      Number(batch.total_kg),
      line.bags,
    );
  }

  if (totalKg <= 0) {
    return { error: "Selected inventory must have a positive total weight." };
  }

  const { data: shipmentCode, error: codeError } = await supabase.rpc(
    "generate_shipment_number",
  );

  if (codeError || !shipmentCode) {
    return {
      error:
        codeError?.message ??
        "Could not generate shipment number. Run migration 00034 in Supabase.",
    };
  }

  const { data: shipment, error: shipmentError } = await supabase
    .from("shipments")
    .insert({
      shipment_number: shipmentCode,
      customer_id: customerId,
      truck_agent_id: truckAgentId,
      driver_name: driverName,
      driver_phone: driverPhone,
      truck_plate_number: truckPlate,
      container_number: containerNumber,
      seal_number: sealNumber,
      destination_port: destinationPort,
      total_kg: totalKg,
      loading_date: loadingDate || undefined,
      bill_of_lading: billOfLading,
      vessel_name: vesselName,
      vessel_number: vesselNumber,
      notes,
      created_by: actorUserId,
      status: "loaded",
    })
    .select("id")
    .single();

  if (shipmentError || !shipment) {
    return { error: shipmentError?.message ?? "Could not create shipment." };
  }

  const lotLoadRows = loadLines.map((line) => {
    const batch = batchById.get(line.batchId)!;
    return {
      shipment_id: shipment.id,
      warehouse_lot_id: warehouseLotId,
      inventory_batch_id: line.batchId,
      bags: line.bags,
      total_kg: kgForBagLoad(
        Number(batch.bags),
        Number(batch.total_kg),
        line.bags,
      ),
    };
  });

  const { error: linesError } = await supabase
    .from("shipment_lot_loads")
    .insert(lotLoadRows);

  if (linesError) {
    await supabase.from("shipments").delete().eq("id", shipment.id);

    if (linesError.message.includes("not available for shipment")) {
      return {
        error: "One or more inventory batches are not available for allocation.",
      };
    }
    if (linesError.message.includes("Load exceeds bags")) {
      return { error: linesError.message };
    }
    if (linesError.message.includes("not assigned to the selected warehouse lot")) {
      return { error: linesError.message };
    }

    return { error: linesError.message };
  }

  revalidatePath("/logistics");
  revalidatePath("/inventory");
  revalidatePath("/inventory/export");
  return { success: true, shipmentId: shipment.id };
}

export async function updateShipmentStatus(
  shipmentId: string,
  status: string,
): Promise<{ error?: string; success?: boolean }> {
  await requireLogisticsWrite();

  if (!SHIPMENT_STATUSES.includes(status as ShipmentStatus)) {
    return { error: "Invalid shipment status." };
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("shipments")
    .select("id, status")
    .eq("id", shipmentId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!existing) {
    return { error: "Shipment not found." };
  }

  const currentIndex = SHIPMENT_STATUSES.indexOf(
    existing.status as ShipmentStatus,
  );
  const nextIndex = SHIPMENT_STATUSES.indexOf(status as ShipmentStatus);

  if (nextIndex < currentIndex) {
    return { error: "Shipment status cannot move backwards." };
  }

  if (nextIndex > currentIndex + 1) {
    return { error: "Advance shipment status one step at a time." };
  }

  const { error } = await supabase
    .from("shipments")
    .update({ status: status as ShipmentStatus })
    .eq("id", shipmentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/logistics");
  revalidatePath(`/logistics/shipments/${shipmentId}`);
  revalidatePath("/inventory");
  revalidatePath("/inventory/export");
  return { success: true };
}
