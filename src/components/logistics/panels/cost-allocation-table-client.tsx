"use client";

import Link from "next/link";
import { Layers } from "lucide-react";

import { LogisticsEmptyState } from "@/components/logistics/logistics-empty-state";
import { matchesHrQuery } from "@/components/hr/hr-client-filter";
import type { CostAllocationListRow } from "@/lib/logistics/types";

type CostAllocationTableClientProps = {
  rows: CostAllocationListRow[];
  query: string;
};

export function CostAllocationTableClient({
  rows,
  query,
}: CostAllocationTableClientProps) {
  const filtered = rows.filter((row) =>
    matchesHrQuery(query, [
      row.shipmentNumber,
      row.customerName,
      row.inventoryNumber,
      row.productType,
      row.loadingDate,
    ]),
  );

  if (rows.length === 0) {
    return (
      <LogisticsEmptyState
        icon={Layers}
        message="No inventory allocated to shipments yet."
      />
    );
  }

  if (filtered.length === 0) {
    return (
      <p className="px-4 py-12 text-center text-sm text-muted-foreground">
        No allocation lines match your search.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border/60 text-muted-foreground">
            <th className="px-4 pb-3 pt-4 text-left text-xs font-medium uppercase tracking-wide">
              Shipment
            </th>
            <th className="px-4 pb-3 pt-4 text-left text-xs font-medium uppercase tracking-wide">
              Customer
            </th>
            <th className="px-4 pb-3 pt-4 text-left text-xs font-medium uppercase tracking-wide">
              Inventory
            </th>
            <th className="px-4 pb-3 pt-4 text-left text-xs font-medium uppercase tracking-wide">
              Product
            </th>
            <th className="px-4 pb-3 pt-4 text-left text-xs font-medium uppercase tracking-wide">
              Bags
            </th>
            <th className="px-4 pb-3 pt-4 text-left text-xs font-medium uppercase tracking-wide">
              KG
            </th>
            <th className="px-4 pb-3 pt-4 text-left text-xs font-medium uppercase tracking-wide">
              Loading date
            </th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border/50 last:border-0"
            >
              <td className="px-4 py-4 font-medium">
                <Link
                  href={`/logistics/shipments/${row.shipmentId}`}
                  className="text-primary hover:underline"
                >
                  {row.shipmentNumber}
                </Link>
              </td>
              <td className="px-4 py-4">{row.customerName}</td>
              <td className="px-4 py-4">{row.inventoryNumber}</td>
              <td className="px-4 py-4">{row.productType}</td>
              <td className="px-4 py-4 tabular-nums">{row.bags}</td>
              <td className="px-4 py-4 tabular-nums">
                {row.totalKg.toLocaleString()}
              </td>
              <td className="px-4 py-4 text-muted-foreground">
                {row.loadingDate}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
