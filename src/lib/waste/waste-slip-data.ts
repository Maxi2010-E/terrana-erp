import { getActiveEmployeesForSelect } from "@/lib/actions/procurement";
import { formatGeneratedAtLabel } from "@/lib/documents/generated-at";
import {
  PROCESSING_SESSION_STATUS_LABELS,
  WASTE_TYPES,
  WASTE_TYPE_LABELS,
  type WasteType,
} from "@/lib/processing/constants";
import { formatProcurementBatchNumber } from "@/lib/procurement/batch-number";
import type { WasteSlipData, WasteSlipLine } from "@/lib/waste/waste-slip-types";
import { createClient } from "@/lib/supabase/server";

function wasteSlipReference(sessionNumber: string): string {
  return `WST-${sessionNumber}`;
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

export async function loadWasteSlipData(
  sessionId: string,
): Promise<WasteSlipData | null> {
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
      output_kg,
      yield_pct,
      status,
      processed_by,
      procurement_batches!inner(
        batch_number,
        product_type,
        suppliers!inner(supplier_name)
      ),
      waste_records(waste_type, number_of_bags, kg_per_bag, extra_kg, weight_kg)
    `,
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (error || !data || data.status !== "completed") {
    return null;
  }

  const batchJoin = data.procurement_batches as
    | {
        batch_number: string;
        product_type: string;
        suppliers: { supplier_name: string } | { supplier_name: string }[];
      }
    | Array<{
        batch_number: string;
        product_type: string;
        suppliers: { supplier_name: string } | { supplier_name: string }[];
      }>;
  const batch = Array.isArray(batchJoin) ? batchJoin[0] : batchJoin;

  const wasteRows = (data.waste_records ?? []) as Array<{
    waste_type: WasteType;
    number_of_bags: number;
    kg_per_bag: number | null;
    extra_kg: number;
    weight_kg: number;
  }>;

  const lines: WasteSlipLine[] = WASTE_TYPES.flatMap((type) => {
    const row = wasteRows.find((record) => record.waste_type === type);
    const weightKg = Number(row?.weight_kg ?? 0);

    if (weightKg <= 0) {
      return [];
    }

    return [
      {
        wasteType: type,
        label: WASTE_TYPE_LABELS[type],
        numberOfBags: Number(row?.number_of_bags ?? 0),
        kgPerBag: row?.kg_per_bag != null ? Number(row.kg_per_bag) : null,
        extraKg: Number(row?.extra_kg ?? 0),
        weightKg,
      },
    ];
  });

  if (lines.length === 0) {
    return null;
  }

  let processedByLabel: string | null = null;
  if (data.processed_by) {
    const employees = await getActiveEmployeesForSelect();
    processedByLabel =
      employees.find((employee) => employee.id === data.processed_by)?.label ??
      null;
  }

  const totalWasteKg =
    Math.round(lines.reduce((sum, line) => sum + line.weightKg, 0) * 1000) /
    1000;

  return {
    companyName: "Terrana Africa Limited",
    reference: wasteSlipReference(data.session_number),
    sessionNumber: data.session_number,
    processingDate: data.processing_date,
    statusLabel: PROCESSING_SESSION_STATUS_LABELS.completed.toUpperCase(),
    batchNumber: formatProcurementBatchNumber(batch.batch_number),
    supplierName: supplierName(batch.suppliers),
    productType: batch.product_type,
    bagsSent: Number(data.bags_sent),
    inputKg: Number(data.input_kg),
    outputKg: data.output_kg != null ? Number(data.output_kg) : null,
    yieldPct: data.yield_pct != null ? Number(data.yield_pct) : null,
    lines,
    totalWasteKg,
    processedByLabel,
    generatedAtLabel: formatGeneratedAtLabel(),
  };
}

export function wasteSlipFilename(data: WasteSlipData): string {
  const session = data.sessionNumber.replace(/[^a-zA-Z0-9-]+/g, "-");
  return `waste-slip-${session}.pdf`;
}
