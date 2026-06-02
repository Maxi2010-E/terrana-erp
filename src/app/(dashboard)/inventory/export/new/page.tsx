import { CreateInventoryForm } from "@/components/inventory/create-inventory-form";
import { PageHeader } from "@/components/layout/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAvailablePreStockForInventory } from "@/lib/actions/inventory";
import { requireInventoryWrite } from "@/lib/auth/require-role";

export default async function CreateExportInventoryPage() {
  await requireInventoryWrite();
  const options = await getAvailablePreStockForInventory();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create export inventory"
        meta={`${options.length.toLocaleString()} available pre-stock record(s)`}
        description="Select pre-stock for the mix, then enter actual export bags and KG after re-bagging to 25 kg standard."
        actions={
          <LinkButton variant="outline" href="/inventory/export">
            Back to export inventory
          </LinkButton>
        }
      />

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-base">Grade pre-stock</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-6 pt-5">
          <CreateInventoryForm options={options} />
        </CardContent>
      </Card>
    </div>
  );
}
