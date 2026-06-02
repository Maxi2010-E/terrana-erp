import type {
  MixedType,
  ProductAge,
  ProductColor,
  ProductCondition,
  ProcurementType,
} from "@/lib/procurement/constants";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function buildProductType(input: {
  product_condition: ProductCondition;
  product_age?: ProductAge | null;
  product_color?: ProductColor | null;
  mixed_type?: MixedType | null;
}): string {
  if (input.product_condition === "mixed") {
    if (!input.mixed_type) {
      return "Mixed";
    }

    const labels: Record<MixedType, string> = {
      red_mixed: "Red Mixed",
      black_mixed: "Black Mixed",
      combined_mixed: "Combined Mixed",
    };

    return labels[input.mixed_type];
  }

  const parts = [
    capitalize(input.product_condition),
    input.product_age ? capitalize(input.product_age) : "",
    input.product_color ? capitalize(input.product_color) : "",
  ].filter(Boolean);

  return parts.join(" ");
}

export function calcTotalKg(input: {
  procurement_type: ProcurementType;
  product_condition: ProductCondition;
  number_of_bags: number;
  kg_per_bag?: number | null;
  extra_kg: number;
  total_kg_direct?: number | null;
}): number {
  if (input.product_condition === "raw") {
    return input.total_kg_direct ?? 0;
  }

  const extra = input.extra_kg || 0;
  const kgPerBag = input.kg_per_bag ?? 0;

  if (
    input.procurement_type === "off_site" &&
    input.product_condition === "clean" &&
    kgPerBag <= 0
  ) {
    return input.total_kg_direct ?? 0;
  }

  if (input.procurement_type === "off_site" && kgPerBag <= 0) {
    return input.total_kg_direct ?? 0;
  }

  if (kgPerBag <= 0) {
    return 0;
  }

  return input.number_of_bags * kgPerBag + extra;
}

export function calcTotalValue(totalKg: number, unitPrice: number): number {
  return Math.round(totalKg * unitPrice * 100) / 100;
}
