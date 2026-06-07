import Link from "next/link";

import { ShipmentStatusBadge } from "@/components/logistics/shipment-status-badge";
import { SHIPMENT_STATUS_LABELS, type ShipmentStatus } from "@/lib/logistics/constants";

type ShipmentDashboardCardsProps = {
  counts: Record<ShipmentStatus, number>;
};

export function ShipmentDashboardCards({ counts }: ShipmentDashboardCardsProps) {
  const cards: { status: ShipmentStatus; description: string }[] = [
    { status: "loaded", description: "Containers loaded at warehouse" },
    { status: "in_transit", description: "Containers in transit" },
    { status: "delivered", description: "Containers delivered" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <Link
          key={card.status}
          href={`/logistics?tab=shipments&status=${card.status}`}
          className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-colors hover:bg-muted/20"
        >
          <p className="text-sm font-medium">{SHIPMENT_STATUS_LABELS[card.status]}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            {counts[card.status].toLocaleString()}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>
        </Link>
      ))}
    </div>
  );
}
