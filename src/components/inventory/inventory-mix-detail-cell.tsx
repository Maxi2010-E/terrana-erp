import { formatPreStockNumber } from "@/lib/inventory/inventory-number";
import { formatMixSummaryCompact } from "@/lib/inventory/mix-detail";
import type {
  InventoryMixSourceLine,
  InventoryMixSummary,
} from "@/lib/inventory/types";

type InventoryMixDetailCellProps = {
  sources: InventoryMixSourceLine[];
  mixSummary?: InventoryMixSummary | null;
};

export function InventoryMixDetailCell({
  sources,
  mixSummary,
}: InventoryMixDetailCellProps) {
  if (sources.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const showSummary =
    mixSummary != null &&
    (sources.length > 1 ||
      mixSummary.input_bags !== mixSummary.output_bags ||
      mixSummary.input_kg !== mixSummary.output_kg);

  return (
    <div className="max-w-[16rem] space-y-2">
      <ul className="space-y-1.5">
        {sources.map((source, index) => (
          <li
            key={`${source.pre_stock_number}-${index}`}
            className="text-xs leading-snug"
          >
            <span className="font-medium tabular-nums text-foreground">
              {formatPreStockNumber(source.pre_stock_number)}
            </span>
            <span className="block text-muted-foreground tabular-nums">
              {source.source_product_type} · {source.bags.toLocaleString()} bags
              · {source.total_kg.toLocaleString()} kg
            </span>
          </li>
        ))}
      </ul>
      {showSummary && mixSummary ? (
        <p className="border-t border-border/40 pt-2 text-[11px] leading-snug text-muted-foreground tabular-nums">
          {formatMixSummaryCompact(mixSummary)}
        </p>
      ) : null}
    </div>
  );
}
