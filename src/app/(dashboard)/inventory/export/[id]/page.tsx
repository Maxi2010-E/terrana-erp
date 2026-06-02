import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { InventoryStatusBadge } from "@/components/inventory/inventory-status-badge";
import { ProductTypeBadge } from "@/components/procurement/product-type-badge";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInventoryBatchById } from "@/lib/actions/inventory";
import { requireInventoryRead } from "@/lib/auth/require-role";
import {
  formatInventoryNumber,
  formatPreStockNumber,
} from "@/lib/inventory/inventory-number";
import { GradingVarianceAlerts } from "@/components/inventory/grading-variance-alerts";
import { EXPORT_STANDARD_KG_PER_BAG } from "@/lib/inventory/grading-variance";
import type { InventoryStatus } from "@/lib/inventory/constants";

type ExportInventoryDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
};

function successMessage(message: string | undefined): string | null {
  if (message === "created") {
    return "Export inventory batch created successfully.";
  }
  return null;
}

export default async function ExportInventoryDetailPage({
  params,
  searchParams,
}: ExportInventoryDetailPageProps) {
  await requireInventoryRead();
  const { id } = await params;
  const query = await searchParams;
  const flash = successMessage(query.message);
  const batch = await getInventoryBatchById(id);

  if (!batch) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {formatInventoryNumber(batch.inventory_number)}
            </h1>
            <InventoryStatusBadge status={batch.status as InventoryStatus} />
            <ProductTypeBadge productType={batch.product_type} />
          </div>
          <p className="text-sm text-muted-foreground">
            Graded {batch.date_graded} · {batch.bags.toLocaleString()} bags ·{" "}
            {batch.total_kg.toLocaleString()} kg
          </p>
        </div>
        <LinkButton variant="outline" href="/inventory/export">
          Back to export inventory
        </LinkButton>
      </div>

      {flash ? (
        <p
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200"
          role="status"
        >
          {flash}
        </p>
      ) : null}

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-base">Batch summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 px-4 pb-6 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryItem label="Inventory number" value={formatInventoryNumber(batch.inventory_number)} />
          <SummaryItem
            label="Product type"
            value={<ProductTypeBadge productType={batch.product_type} />}
          />
          <SummaryItem label="Bags" value={batch.bags.toLocaleString()} />
          <SummaryItem label="Total KG" value={batch.total_kg.toLocaleString()} />
          {batch.grade_composition?.nominal_output_kg != null ? (
            <SummaryItem
              label="25 kg standard"
              value={`${batch.grade_composition.nominal_output_kg.toLocaleString()} kg (${batch.bags.toLocaleString()} × ${EXPORT_STANDARD_KG_PER_BAG})`}
            />
          ) : null}
          <SummaryItem label="Date graded" value={batch.date_graded} />
          <SummaryItem label="Status" value={batch.status} />
          <SummaryItem
            label="Created"
            value={new Date(batch.created_at).toLocaleString()}
          />
          {batch.notes ? (
            <div className="sm:col-span-2 lg:col-span-4">
              <SummaryItem label="Notes" value={batch.notes} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {batch.grade_composition?.input_kg != null &&
      batch.grade_composition.output_kg != null ? (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base">Mix input vs export output</CardTitle>
            <p className="text-sm text-muted-foreground">
              Pre-mix totals from pre-stock compared with post-mix export bags
              and KG after re-bagging to {EXPORT_STANDARD_KG_PER_BAG} kg.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-6 pt-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryItem
                label="Pre-mix bags"
                value={batch.grade_composition.input_bags?.toLocaleString() ?? "—"}
              />
              <SummaryItem
                label="Pre-mix KG"
                value={batch.grade_composition.input_kg.toLocaleString()}
              />
              <SummaryItem
                label="Export bags"
                value={batch.grade_composition.output_bags?.toLocaleString() ?? batch.bags.toLocaleString()}
              />
              <SummaryItem
                label="Export KG"
                value={batch.grade_composition.output_kg.toLocaleString()}
              />
              <SummaryItem
                label="Bag variance"
                value={formatVariance(batch.grade_composition.bag_variance)}
              />
              <SummaryItem
                label="KG variance"
                value={formatVariance(batch.grade_composition.kg_variance, " kg")}
              />
            </div>
            <GradingVarianceAlerts
              inputBags={batch.grade_composition.input_bags ?? 0}
              inputKg={batch.grade_composition.input_kg}
              outputBags={batch.grade_composition.output_bags ?? batch.bags}
              outputKg={batch.grade_composition.output_kg}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-base">Source pre-stock</CardTitle>
          <p className="text-sm text-muted-foreground">
            Full traceability from pre-stock into this export inventory batch.
          </p>
        </CardHeader>
        <CardContent className="px-4 pb-6 pt-5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground">
                  <th className="px-4 pb-3 pt-1 text-xs font-medium uppercase">
                    Pre-stock
                  </th>
                  <th className="px-4 pb-3 pt-1 text-xs font-medium uppercase">
                    Product
                  </th>
                  <th className="px-4 pb-3 pt-1 text-xs font-medium uppercase">
                    Source
                  </th>
                  <th className="px-4 pb-3 pt-1 text-xs font-medium uppercase">
                    Bags
                  </th>
                  <th className="px-4 pb-3 pt-1 text-xs font-medium uppercase">
                    KG
                  </th>
                  <th className="px-4 pb-3 pt-1 text-xs font-medium uppercase">
                    Received
                  </th>
                </tr>
              </thead>
              <tbody>
                {batch.sources.map((source) => (
                  <tr
                    key={source.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="px-4 py-4 font-medium tabular-nums">
                      {formatPreStockNumber(source.pre_stock_number)}
                    </td>
                    <td className="px-4 py-4">
                      <ProductTypeBadge
                        productType={source.source_product_type}
                      />
                    </td>
                    <td className="px-4 py-4">
                      {source.source_href ? (
                        <Link
                          href={source.source_href}
                          className="text-primary hover:underline"
                        >
                          {source.source_label}
                        </Link>
                      ) : (
                        source.source_label
                      )}
                    </td>
                    <td className="px-4 py-4 tabular-nums">
                      {source.bags.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 tabular-nums">
                      {source.total_kg.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 tabular-nums text-muted-foreground">
                      {source.date_received}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

function formatVariance(value: number | undefined, suffix = ""): string {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  const rounded = Math.round(value * 1000) / 1000;
  const prefix = rounded > 0 ? "+" : "";
  return `${prefix}${rounded.toLocaleString()}${suffix}`;
}
