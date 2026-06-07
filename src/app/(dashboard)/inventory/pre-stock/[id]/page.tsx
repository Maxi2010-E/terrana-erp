import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { InventoryStatusBadge } from "@/components/inventory/inventory-status-badge";
import { PreStockSourceLinks } from "@/components/inventory/pre-stock-source-links";
import { PageHeader } from "@/components/layout/page-header";
import { ProductTypeBadge } from "@/components/procurement/product-type-badge";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPreStockById } from "@/lib/actions/inventory";
import { requireInventoryRead } from "@/lib/auth/require-role";
import type { InventoryStatus } from "@/lib/inventory/constants";
import { formatPreStockNumber } from "@/lib/inventory/inventory-number";
import { PRE_STOCK_SOURCE_TYPE_LABELS } from "@/lib/inventory/constants";

type PreStockDetailPageProps = {
  params: Promise<{ id: string }>;
};

function SummaryItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

export default async function PreStockDetailPage({ params }: PreStockDetailPageProps) {
  await requireInventoryRead();
  const { id } = await params;
  const row = await getPreStockById(id);

  if (!row) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={formatPreStockNumber(row.pre_stock_number)}
        meta={`Received ${row.date_received} · ${row.bags.toLocaleString()} bags available · ${row.total_kg.toLocaleString()} kg`}
        actions={
          <LinkButton variant="outline" href="/inventory?tab=pre_stock">
            Back to pre-stock
          </LinkButton>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <InventoryStatusBadge status={row.status as InventoryStatus} />
        <ProductTypeBadge productType={row.product_type} />
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-base">Pre-stock summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 px-4 pb-6 pt-5 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryItem
            label="Pre-stock number"
            value={formatPreStockNumber(row.pre_stock_number)}
          />
          <SummaryItem
            label="Source type"
            value={PRE_STOCK_SOURCE_TYPE_LABELS[row.source_type]}
          />
          <SummaryItem
            label="Source"
            value={<PreStockSourceLinks links={row.source_links} />}
          />
          <SummaryItem
            label="Bags available"
            value={`${row.bags.toLocaleString()} / ${row.bags_received.toLocaleString()} received`}
          />
          <SummaryItem
            label="KG available"
            value={`${row.total_kg.toLocaleString()} / ${row.total_kg_received.toLocaleString()} received`}
          />
          <SummaryItem label="Date received" value={row.date_received} />
        </CardContent>
      </Card>
    </div>
  );
}
