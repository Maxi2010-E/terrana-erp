import { ShipmentCreateForm } from "@/components/logistics/shipment-create-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveCustomersForSelect } from "@/lib/actions/customers";
import { createShipment } from "@/lib/actions/shipments";
import { getTruckAgentsForSelect } from "@/lib/actions/truck-agents";
import { getWarehouseLotsForShipmentSelect } from "@/lib/actions/warehouse-lots";
import { requireLogisticsWrite } from "@/lib/auth/require-role";

export default async function NewShipmentPage() {
  await requireLogisticsWrite();

  const [customers, truckAgents, warehouseLots] = await Promise.all([
    getActiveCustomersForSelect(),
    getTruckAgentsForSelect(),
    getWarehouseLotsForShipmentSelect(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create shipment"
        description="Load export inventory from a warehouse lot into a new container (partial bags allowed)."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shipment details</CardTitle>
        </CardHeader>
        <CardContent>
          <ShipmentCreateForm
            action={createShipment}
            customers={customers}
            truckAgents={truckAgents}
            warehouseLots={warehouseLots}
          />
        </CardContent>
      </Card>
    </div>
  );
}
