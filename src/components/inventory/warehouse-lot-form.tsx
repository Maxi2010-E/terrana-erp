"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WarehouseLotFormState } from "@/lib/actions/warehouse-lots";
import type { WarehouseLotDetail } from "@/lib/inventory/types";

type WarehouseLotFormProps = {
  action: (
    state: WarehouseLotFormState,
    formData: FormData,
  ) => Promise<WarehouseLotFormState>;
  lot?: WarehouseLotDetail;
  redirectTo?: string;
};

export function WarehouseLotForm({ action, lot, redirectTo }: WarehouseLotFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state.success && redirectTo) {
      router.push(redirectTo);
      router.refresh();
    } else if (state.success) {
      router.refresh();
    }
  }, [state.success, redirectTo, router]);

  return (
    <form action={formAction} className="space-y-4">
      {!lot ? (
        <p className="text-sm text-muted-foreground">
          Lot code (e.g. WHL-2026-000001) is assigned automatically when you save.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Code: <span className="font-medium text-foreground">{lot.lot_code}</span>
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="label">Label</Label>
          <Input
            id="label"
            name="label"
            defaultValue={lot?.label}
            placeholder="e.g. Lot 1"
            required
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="location_notes">Location notes</Label>
          <Input
            id="location_notes"
            name="location_notes"
            defaultValue={lot?.location_notes ?? ""}
            placeholder="Stack position, aisle, etc."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stacked_date">Stacked date</Label>
          <Input
            id="stacked_date"
            name="stacked_date"
            type="date"
            defaultValue={lot?.stacked_date ?? ""}
          />
        </div>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending || Boolean(state.success && redirectTo)}>
        {pending ? "Saving…" : lot ? "Save changes" : "Create warehouse lot"}
      </Button>
    </form>
  );
}
