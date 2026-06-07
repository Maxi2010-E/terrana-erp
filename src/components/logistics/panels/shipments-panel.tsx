import Link from "next/link";

import { LogisticsEmptyState } from "@/components/logistics/logistics-empty-state";
import { ShipmentStatusBadge } from "@/components/logistics/shipment-status-badge";
import { TableViewAction } from "@/components/ui/table-view-action";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  getShipmentsList,
} from "@/lib/actions/shipments";
import type { ShipmentStatus } from "@/lib/logistics/constants";
import { Package } from "lucide-react";

type ShipmentsPanelProps = {
  page: number;
  query: string;
  status?: ShipmentStatus;
};

const HEAD_CELL =
  "px-4 pb-3 pt-1 text-left text-xs font-medium tracking-wide uppercase text-muted-foreground";
const BODY_CELL = "px-4 py-4 align-middle leading-normal";

export async function ShipmentsPanel({
  page,
  query,
  status,
}: ShipmentsPanelProps) {
  const { rows, total } = await getShipmentsList(page, query, status);

  if (total === 0 && !query && !status) {
    return (
      <LogisticsEmptyState
        icon={Package}
        message="No shipments recorded yet."
      />
    );
  }

  return (
    <div className="space-y-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border/60">
              <th className={HEAD_CELL}>Shipment</th>
              <th className={HEAD_CELL}>Customer</th>
              <th className={HEAD_CELL}>Container</th>
              <th className={HEAD_CELL}>Seal</th>
              <th className={HEAD_CELL}>Loading date</th>
              <th className={HEAD_CELL}>Total KG</th>
              <th className={HEAD_CELL}>Status</th>
              <th className={HEAD_CELL}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No shipments match your search.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className={`${BODY_CELL} font-medium`}>
                    <Link
                      href={`/logistics/shipments/${row.id}`}
                      className="text-primary hover:underline"
                    >
                      {row.shipment_number}
                    </Link>
                  </td>
                  <td className={BODY_CELL}>{row.customer_name}</td>
                  <td className={BODY_CELL}>{row.container_number}</td>
                  <td className={BODY_CELL}>{row.seal_number}</td>
                  <td className={`${BODY_CELL} tabular-nums`}>
                    {row.loading_date}
                  </td>
                  <td className={`${BODY_CELL} tabular-nums`}>
                    {row.total_kg.toLocaleString()}
                  </td>
                  <td className={BODY_CELL}>
                    <ShipmentStatusBadge status={row.status} />
                  </td>
                  <td className={BODY_CELL}>
                    <TableViewAction href={`/logistics/shipments/${row.id}`} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border/60 px-4 py-4">
        <PaginationBar
          page={page}
          total={total}
          pathname="/logistics"
          query={{
            tab: "shipments",
            q: query || undefined,
            status: status || undefined,
          }}
        />
      </div>
    </div>
  );
}
