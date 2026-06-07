"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { updateShipmentStatus } from "@/lib/actions/shipments";
import {
  SHIPMENT_STATUSES,
  SHIPMENT_STATUS_LABELS,
  type ShipmentStatus,
} from "@/lib/logistics/constants";

type ShipmentStatusActionsProps = {
  shipmentId: string;
  status: ShipmentStatus;
};

export function ShipmentStatusActions({
  shipmentId,
  status,
}: ShipmentStatusActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const currentIndex = SHIPMENT_STATUSES.indexOf(status);
  const nextStatus = SHIPMENT_STATUSES[currentIndex + 1];

  if (!nextStatus) {
    return (
      <p className="text-sm text-muted-foreground">
        Shipment delivered — inventory marked as shipped.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await updateShipmentStatus(shipmentId, nextStatus);
            if (result.error) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending
          ? "Updating…"
          : `Mark as ${SHIPMENT_STATUS_LABELS[nextStatus].toLowerCase()}`}
      </Button>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
