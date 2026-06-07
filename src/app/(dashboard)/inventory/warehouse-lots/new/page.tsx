import { WarehouseLotForm } from "@/components/inventory/warehouse-lot-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createWarehouseLot } from "@/lib/actions/warehouse-lots";
import { requireInventoryWrite } from "@/lib/auth/require-role";

export default async function NewWarehouseLotPage() {
  await requireInventoryWrite();

  return (
    <div className="space-y-6">
      <PageHeader title="Add warehouse lot" />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Lot details</CardTitle>
        </CardHeader>
        <CardContent>
          <WarehouseLotForm
            action={createWarehouseLot}
            redirectTo="/inventory?tab=warehouse_lots&message=lot_created"
          />
        </CardContent>
      </Card>
    </div>
  );
}
