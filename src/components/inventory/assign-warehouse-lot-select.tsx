"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { assignInventoryToWarehouseLot } from "@/lib/actions/warehouse-lots";
import type { WarehouseLotOption } from "@/lib/inventory/types";

const selectClassName =
  "h-9 max-w-[11rem] rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type AssignWarehouseLotSelectProps = {
  batchId: string;
  currentLotId: string | null;
  lots: WarehouseLotOption[];
  disabled?: boolean;
};

export function AssignWarehouseLotSelect({
  batchId,
  currentLotId,
  lots,
  disabled = false,
}: AssignWarehouseLotSelectProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(value: string) {
    setError(null);
    const lotId = value === "" ? null : value;
    startTransition(async () => {
      const result = await assignInventoryToWarehouseLot(batchId, lotId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-1">
      <select
        className={selectClassName}
        value={currentLotId ?? ""}
        disabled={disabled || pending}
        onChange={(event) => handleChange(event.target.value)}
        aria-label="Assign warehouse lot"
      >
        <option value="">Unassigned</option>
        {lots.map((lot) => (
          <option key={lot.id} value={lot.id}>
            {lot.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
