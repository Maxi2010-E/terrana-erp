import {
  formatApprovedAtLabel,
  formatGeneratedAtLabel,
} from "@/lib/documents/generated-at";
import {
  MIXED_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
  PROCUREMENT_STATUS_LABELS,
  PROCUREMENT_TYPE_LABELS,
  PRODUCT_AGE_LABELS,
  PRODUCT_COLOR_LABELS,
  PRODUCT_CONDITION_LABELS,
  QUALITY_DECISION_LABELS,
  type MixedType,
  type PaymentStatus,
  type ProcurementStatus,
  type ProcurementType,
  type ProductAge,
  type ProductColor,
  type ProductCondition,
  type QualityDecision,
} from "@/lib/procurement/constants";
import { canViewProcurementPricing } from "@/lib/procurement/permissions";
import type { SupplyInvoiceData } from "@/lib/procurement/supply-invoice-types";
import { formatProcurementBatchNumber } from "@/lib/procurement/batch-number";
import {
  nameFromMap,
  resolveUserDisplayNames,
} from "@/lib/users/resolve-user-names";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/roles";

function supplyInvoiceReference(batchNumber: string): string {
  return `INV-${formatProcurementBatchNumber(batchNumber)}`;
}

export async function loadSupplyInvoiceData(
  batchId: string,
  role: AppRole,
): Promise<SupplyInvoiceData | null> {
  const supabase = await createClient();
  const showPricing = canViewProcurementPricing(role);

  const { data: batch, error } = await supabase
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
      number_of_bags,
      kg_per_bag,
      extra_kg,
      total_kg,
      unit_price,
      total_value,
      procurement_date,
      quality_decision,
      payment_status,
      status,
      notes,
      approved_by,
      approved_at,
      suppliers (
        supplier_name,
        supplier_code,
        address,
        phone
      )
    `,
    )
    .eq("id", batchId)
    .maybeSingle();

  if (error || !batch || batch.status !== "approved") {
    return null;
  }

  const supplierJoin = batch.suppliers as
    | {
        supplier_name: string;
        supplier_code: string;
        address: string | null;
        phone: string | null;
      }
    | Array<{
        supplier_name: string;
        supplier_code: string;
        address: string | null;
        phone: string | null;
      }>
    | null;
  const supplier = Array.isArray(supplierJoin) ? supplierJoin[0] : supplierJoin;

  if (!supplier) {
    return null;
  }

  const nameByUserId = await resolveUserDisplayNames([batch.approved_by]);
  const batchNumberDisplay = formatProcurementBatchNumber(batch.batch_number);
  const procurementType = batch.procurement_type as ProcurementType;
  const productCondition = batch.product_condition as ProductCondition | null;
  const productAge = batch.product_age as ProductAge | null;
  const productColor = batch.product_color as ProductColor | null;
  const mixedType = batch.mixed_type as MixedType | null;
  const qualityDecision = batch.quality_decision as QualityDecision;
  const paymentStatus = batch.payment_status as PaymentStatus;
  const status = batch.status as ProcurementStatus;

  return {
    companyName: "Terrana Africa Limited",
    reference: supplyInvoiceReference(batch.batch_number),
    batchNumber: batch.batch_number,
    batchNumberDisplay,
    procurementDate: batch.procurement_date,
    statusLabel: PROCUREMENT_STATUS_LABELS[status].toUpperCase(),
    showPricing,
    supplierName: supplier.supplier_name,
    supplierCode: supplier.supplier_code,
    supplierAddress: supplier.address,
    supplierPhone: supplier.phone,
    procurementTypeLabel: PROCUREMENT_TYPE_LABELS[procurementType],
    productType: batch.product_type,
    productConditionLabel: productCondition
      ? PRODUCT_CONDITION_LABELS[productCondition]
      : null,
    productAgeLabel: productAge ? PRODUCT_AGE_LABELS[productAge] : null,
    productColorLabel: productColor ? PRODUCT_COLOR_LABELS[productColor] : null,
    mixedTypeLabel: mixedType ? MIXED_TYPE_LABELS[mixedType] : null,
    numberOfBags: Number(batch.number_of_bags),
    kgPerBag: batch.kg_per_bag != null ? Number(batch.kg_per_bag) : null,
    extraKg: Number(batch.extra_kg),
    totalKg: Number(batch.total_kg),
    unitPrice: showPricing ? Number(batch.unit_price) : null,
    totalValue: showPricing ? Number(batch.total_value) : null,
    qualityDecisionLabel: QUALITY_DECISION_LABELS[qualityDecision],
    paymentStatusLabel: PAYMENT_STATUS_LABELS[paymentStatus],
    approvedByName: nameFromMap(nameByUserId, batch.approved_by),
    approvedAtLabel: formatApprovedAtLabel(batch.approved_at),
    notes: batch.notes,
    generatedAtLabel: formatGeneratedAtLabel(),
  };
}

export function supplyInvoiceFilename(data: SupplyInvoiceData): string {
  const batch = data.batchNumberDisplay.replace(/[^a-zA-Z0-9-]+/g, "-");
  return `supply-invoice-${batch}.pdf`;
}
