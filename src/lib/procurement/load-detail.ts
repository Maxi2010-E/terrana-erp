import type {
  ProcurementType,
  ProductCondition,
} from "@/lib/procurement/constants";
import {
  showDirectTotalKg,
  showExtraKgField,
} from "@/lib/procurement/quantity-rules";

export type ProcurementLoadDetailInput = {
  procurement_type: ProcurementType;
  product_condition: ProductCondition;
  number_of_bags: number;
  kg_per_bag: number | null;
  extra_kg: number;
};

export type ProcurementLoadDetail = {
  bagCount: number;
  kgPerBag: number | null;
  extraKg: number;
  showExtraKgLine: boolean;
};

export function getProcurementLoadDetail(
  input: ProcurementLoadDetailInput,
): ProcurementLoadDetail | null {
  if (
    showDirectTotalKg(
      input.procurement_type,
      input.product_condition,
      input.kg_per_bag,
    )
  ) {
    if (input.number_of_bags <= 0) {
      return null;
    }

    return {
      bagCount: input.number_of_bags,
      kgPerBag: null,
      extraKg: 0,
      showExtraKgLine: false,
    };
  }

  return {
    bagCount: input.number_of_bags,
    kgPerBag:
      input.kg_per_bag != null && input.kg_per_bag > 0
        ? input.kg_per_bag
        : null,
    extraKg: showExtraKgField(input.product_condition) ? input.extra_kg : 0,
    showExtraKgLine: showExtraKgField(input.product_condition),
  };
}

export function formatProcurementLoadDetail(
  input: ProcurementLoadDetailInput,
): string {
  const detail = getProcurementLoadDetail(input);
  if (!detail) {
    return "—";
  }

  const bagLabel = detail.bagCount === 1 ? "bag" : "bags";
  const parts: string[] = [
    `${detail.bagCount.toLocaleString()} ${bagLabel}`,
  ];

  if (detail.kgPerBag != null) {
    parts.push(`${detail.kgPerBag.toLocaleString()} kg/bag`);
  }

  if (detail.showExtraKgLine) {
    parts.push(`${Number(detail.extraKg).toLocaleString()} kg extra`);
  }

  return parts.join(" · ");
}
