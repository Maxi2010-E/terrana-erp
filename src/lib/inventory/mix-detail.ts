import { formatPreStockNumber } from "@/lib/inventory/inventory-number";
import type {
  InventoryMixSourceLine,
  InventoryMixSummary,
} from "@/lib/inventory/types";

export type { InventoryMixSourceLine, InventoryMixSummary };

export function formatMixSummaryCompact(
  summary: InventoryMixSummary,
): string {
  return `In ${summary.input_bags.toLocaleString()} bags · ${summary.input_kg.toLocaleString()} kg → Out ${summary.output_bags.toLocaleString()} · ${summary.output_kg.toLocaleString()} kg`;
}
