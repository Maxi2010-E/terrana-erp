"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNaira } from "@/lib/currency";
import type { ProcurementFormState } from "@/lib/procurement/form-state";
import { calcTotalValue } from "@/lib/procurement/product-type";

type ProcurementUnitPriceFormProps = {
  action: (
    state: ProcurementFormState,
    formData: FormData,
  ) => Promise<ProcurementFormState>;
  batchId: string;
  totalKg: number;
  initialUnitPrice?: number | null;
  redirectTo?: string;
};

export function ProcurementUnitPriceForm({
  action,
  batchId,
  totalKg,
  initialUnitPrice,
  redirectTo,
}: ProcurementUnitPriceFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {});
  const [unitPrice, setUnitPrice] = useState(
    initialUnitPrice != null && initialUnitPrice > 0
      ? String(initialUnitPrice)
      : "",
  );

  const parsedPrice = Number.parseFloat(unitPrice.replace(/,/g, ""));
  const totalValue = useMemo(() => {
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return null;
    }
    return calcTotalValue(totalKg, parsedPrice);
  }, [parsedPrice, totalKg]);

  useEffect(() => {
    if (state.success) {
      if (redirectTo) {
        router.replace(redirectTo);
      } else {
        router.refresh();
      }
    }
  }, [state.success, redirectTo, router]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="batch_id" value={batchId} />

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p
          className="text-sm text-emerald-700 dark:text-emerald-300"
          role="status"
        >
          Unit price saved. You can now final approve.
        </p>
      ) : null}

      <div className="grid gap-4 sm:max-w-sm">
        <div className="space-y-2">
          <Label htmlFor="unit_price">Unit price (₦ per kg)</Label>
          <Input
            id="unit_price"
            name="unit_price"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            value={unitPrice}
            onChange={(event) => setUnitPrice(event.target.value)}
            className="tabular-nums"
            required
          />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total batch value</p>
          <p className="text-sm font-medium tabular-nums">
            {totalValue != null ? formatNaira(totalValue) : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Based on {totalKg.toLocaleString()} kg recorded by warehouse.
          </p>
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save unit price"}
      </Button>
    </form>
  );
}
