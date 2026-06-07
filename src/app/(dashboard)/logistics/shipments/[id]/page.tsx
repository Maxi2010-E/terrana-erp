import Link from "next/link";
import { notFound } from "next/navigation";

import { ShipmentStatusActions } from "@/components/logistics/shipment-status-actions";
import { ShipmentStatusBadge } from "@/components/logistics/shipment-status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { SuccessFlash } from "@/components/layout/success-flash";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getShipmentById } from "@/lib/actions/shipments";
import { requireLogisticsRead } from "@/lib/auth/require-role";
import type { ShipmentStatus } from "@/lib/logistics/constants";
import { canWriteLogistics } from "@/lib/logistics/permissions";

type ShipmentDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
};

const HEAD_CELL =
  "px-4 pb-3 pt-1 text-left text-xs font-medium tracking-wide uppercase";
const BODY_CELL = "px-4 py-3 align-middle leading-normal";

export default async function ShipmentDetailPage({
  params,
  searchParams,
}: ShipmentDetailPageProps) {
  const { role } = await requireLogisticsRead();
  const canEdit = canWriteLogistics(role);
  const { id } = await params;
  const query = await searchParams;
  const shipment = await getShipmentById(id);

  if (!shipment) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={shipment.shipment_number}
        meta={`${shipment.container_number} · ${shipment.customer_name}`}
        actions={
          <LinkButton variant="outline" href="/logistics?tab=shipments">
            Back to list
          </LinkButton>
        }
      />

      {query.message === "created" ? (
        <SuccessFlash message="Shipment created successfully." />
      ) : null}

      <ShipmentStatusBadge status={shipment.status as ShipmentStatus} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Customer</dt>
                <dd>
                  <Link
                    href={`/logistics/customers/${shipment.customer_id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {shipment.customer_code} · {shipment.customer_name}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Truck agent</dt>
                <dd>{shipment.truck_agent_name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Driver</dt>
                <dd>{shipment.driver_name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Driver phone</dt>
                <dd>{shipment.driver_phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Truck plate</dt>
                <dd>{shipment.truck_plate_number ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Loading date</dt>
                <dd>{shipment.loading_date}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Container</dt>
                <dd>{shipment.container_number}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Seal</dt>
                <dd>{shipment.seal_number}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Destination port</dt>
                <dd>{shipment.destination_port ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Total KG</dt>
                <dd className="font-medium tabular-nums">
                  {shipment.total_kg.toLocaleString()} kg
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Bill of lading</dt>
                <dd>{shipment.bill_of_lading ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Vessel</dt>
                <dd>
                  {shipment.vessel_name ?? "—"}
                  {shipment.vessel_number ? ` (${shipment.vessel_number})` : ""}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
          </CardHeader>
          <CardContent>
            {canEdit ? (
              <ShipmentStatusActions
                shipmentId={shipment.id}
                status={shipment.status as ShipmentStatus}
              />
            ) : (
              <ShipmentStatusBadge status={shipment.status as ShipmentStatus} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inventory sources</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground">
                  <th className={HEAD_CELL}>Inventory</th>
                  <th className={HEAD_CELL}>Product</th>
                  <th className={HEAD_CELL}>Warehouse lot</th>
                  <th className={HEAD_CELL}>Bags</th>
                  <th className={HEAD_CELL}>KG</th>
                </tr>
              </thead>
              <tbody>
                {shipment.inventory_lines.map((line) => (
                  <tr key={line.id} className="border-b border-border/50 last:border-0">
                    <td className={BODY_CELL}>
                      <Link
                        href={`/inventory/export/${line.inventory_batch_id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {line.inventory_number}
                      </Link>
                    </td>
                    <td className={BODY_CELL}>{line.product_type}</td>
                    <td className={BODY_CELL}>
                      {line.warehouse_lot_label ?? "—"}
                    </td>
                    <td className={`${BODY_CELL} tabular-nums`}>{line.bags}</td>
                    <td className={`${BODY_CELL} tabular-nums`}>
                      {line.total_kg.toLocaleString()}
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
