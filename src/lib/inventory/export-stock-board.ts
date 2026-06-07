import { GRADED_COMBINATION_LABELS } from "@/lib/inventory/graded-product-type.constants";
import type { ExportInventoryStockLine } from "@/lib/inventory/types";

const PRODUCT_TYPE_ORDER = [
  "Clean New Red",
  "Clean New Black",
  "Clean Old Red",
  "Clean Old Black",
  "Red Mixed",
  "Black Mixed",
  "New Combined Mixed",
  "Old Combined Mixed",
  GRADED_COMBINATION_LABELS.combinedMixed,
  "Mixed",
] as const;

function productTypeSortIndex(productType: string): number {
  const index = PRODUCT_TYPE_ORDER.indexOf(
    productType as (typeof PRODUCT_TYPE_ORDER)[number],
  );
  return index >= 0 ? index : PRODUCT_TYPE_ORDER.length;
}

export function sortExportInventoryStockLines(
  lines: ExportInventoryStockLine[],
): ExportInventoryStockLine[] {
  return [...lines].sort((a, b) => {
    const orderDiff =
      productTypeSortIndex(a.product_type) - productTypeSortIndex(b.product_type);
    if (orderDiff !== 0) {
      return orderDiff;
    }
    return a.product_type.localeCompare(b.product_type);
  });
}
