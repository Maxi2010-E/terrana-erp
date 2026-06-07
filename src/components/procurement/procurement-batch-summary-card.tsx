import { ProductTypeBadge } from "@/components/procurement/product-type-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNairaOrDash } from "@/lib/currency";
import {
  PROCUREMENT_TYPE_LABELS,
  QUALITY_DECISION_LABELS,
  type ProcurementType,
  type QualityDecision,
} from "@/lib/procurement/constants";
import type { ProcurementBatch } from "@/lib/procurement/types";

type ProcurementBatchSummaryCardProps = {
  batch: ProcurementBatch & {
    supplier_name?: string;
    supplier_code?: string;
    created_by_name?: string | null;
    first_approved_by_name?: string | null;
  };
  showPricing?: boolean;
  title?: string;
};

export function ProcurementBatchSummaryCard({
  batch,
  showPricing = false,
  title = "Batch summary",
}: ProcurementBatchSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <dt className="text-xs text-muted-foreground">Product</dt>
            <dd className="mt-1">
              <ProductTypeBadge productType={batch.product_type} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Type</dt>
            <dd className="text-sm font-medium">
              {PROCUREMENT_TYPE_LABELS[batch.procurement_type as ProcurementType]}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Supplier</dt>
            <dd className="text-sm font-medium">
              {batch.supplier_name ?? "—"}
              {batch.supplier_code ? ` (${batch.supplier_code})` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Total KG</dt>
            <dd className="text-sm font-medium">
              {Number(batch.total_kg).toLocaleString()} kg
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Bags</dt>
            <dd className="text-sm font-medium">{batch.number_of_bags}</dd>
          </div>
          {batch.kg_per_bag != null ? (
            <div>
              <dt className="text-xs text-muted-foreground">KG per bag</dt>
              <dd className="text-sm font-medium">{batch.kg_per_bag}</dd>
            </div>
          ) : null}
          {Number(batch.extra_kg) > 0 ? (
            <div>
              <dt className="text-xs text-muted-foreground">Extra KG</dt>
              <dd className="text-sm font-medium">{batch.extra_kg}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs text-muted-foreground">Procurement date</dt>
            <dd className="text-sm font-medium">{batch.procurement_date}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Quality decision</dt>
            <dd className="text-sm font-medium">
              {
                QUALITY_DECISION_LABELS[
                  batch.quality_decision as QualityDecision
                ]
              }
            </dd>
          </div>
          {showPricing ? (
            <>
              <div>
                <dt className="text-xs text-muted-foreground">Unit price</dt>
                <dd className="text-sm font-medium tabular-nums">
                  {formatNairaOrDash(batch.unit_price)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Total value</dt>
                <dd className="text-sm font-medium tabular-nums">
                  {formatNairaOrDash(batch.total_value)}
                </dd>
              </div>
            </>
          ) : null}
          {batch.notes ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <dt className="text-xs text-muted-foreground">Notes</dt>
              <dd className="text-sm">{batch.notes}</dd>
            </div>
          ) : null}
        </dl>
      </CardContent>
    </Card>
  );
}
