import { formatPreStockNumber } from "@/lib/inventory/inventory-number";
import type {
  InventoryMixSourceLine,
  InventoryMixSummary,
} from "@/lib/inventory/types";

export type { InventoryMixSourceLine, InventoryMixSummary };

export function formatMixSourceLine(line: InventoryMixSourceLine): string {
  return `${formatPreStockNumber(line.pre_stock_number)} · ${line.bags.toLocaleString()} bags · ${line.total_kg.toLocaleString()} kg`;
}

export function formatMixSummary(summary: InventoryMixSummary): string {
  return `Pre-mix ${summary.input_bags.toLocaleString()} bags · ${summary.input_kg.toLocaleString()} kg → Export ${summary.output_bags.toLocaleString()} bags · ${summary.output_kg.toLocaleString()} kg`;
}
