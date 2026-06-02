import { ProductTypeBadge } from "@/components/procurement/product-type-badge";
import {
  formatMixSourceLine,
  formatMixSummary,
  type InventoryMixSourceLine,
  type InventoryMixSummary,
} from "@/lib/inventory/mix-detail";

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

  return (
    <div className="space-y-1.5 text-xs leading-snug">
      {sources.map((source, index) => (
        <div key={`${source.pre_stock_number}-${index}`} className="space-y-0.5">
          <p className="tabular-nums">{formatMixSourceLine(source)}</p>
          <ProductTypeBadge productType={source.source_product_type} />
        </div>
      ))}
      {mixSummary ? (
        <p className="border-t border-border/50 pt-1.5 text-muted-foreground tabular-nums">
          {formatMixSummary(mixSummary)}
        </p>
      ) : null}
    </div>
  );
}
