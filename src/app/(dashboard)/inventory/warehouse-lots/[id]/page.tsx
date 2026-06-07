import { notFound } from "next/navigation";

import { WarehouseLotBatchTable } from "@/components/inventory/warehouse-lot-batch-table";
import { WarehouseLotForm } from "@/components/inventory/warehouse-lot-form";
import { PageHeader } from "@/components/layout/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getWarehouseLotById,
  updateWarehouseLot,
} from "@/lib/actions/warehouse-lots";
import { requireInventoryRead } from "@/lib/auth/require-role";

type WarehouseLotDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function WarehouseLotDetailPage({
  params,
}: WarehouseLotDetailPageProps) {
  const session = await requireInventoryRead();
  const canEdit = ["super_admin", "admin", "warehouse_manager"].includes(
    session.role,
  );
  const { id } = await params;
  const lot = await getWarehouseLotById(id);

  if (!lot) {
    notFound();
  }

  const bagsOnHand = lot.batches
    .filter((batch) => batch.status === "available" && batch.bags > 0)
    .reduce((sum, batch) => sum + batch.bags, 0);

  const boundUpdate = updateWarehouseLot.bind(null, id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={lot.label}
        meta={`${lot.lot_code} · ${bagsOnHand.toLocaleString()} bags on hand`}
        actions={
          <LinkButton variant="outline" href="/inventory?tab=warehouse_lots">
            Back to list
          </LinkButton>
        }
      />

      {canEdit ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">Edit lot</CardTitle>
          </CardHeader>
          <CardContent>
            <WarehouseLotForm action={boundUpdate} lot={lot} />
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Inventory at this stack</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-6">
          <WarehouseLotBatchTable rows={lot.batches} />
        </CardContent>
      </Card>
    </div>
  );
}
