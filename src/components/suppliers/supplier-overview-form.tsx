"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SupplierFormState } from "@/lib/actions/suppliers";
import type { Supplier } from "@/lib/suppliers/types";

type SupplierOverviewFormProps = {
  action: (
    state: SupplierFormState,
    formData: FormData,
  ) => Promise<SupplierFormState>;
  supplier: Supplier;
  onCancel?: () => void;
  onSaved?: () => void;
};

export function SupplierOverviewForm({
  action,
  supplier,
  onCancel,
  onSaved,
}: SupplierOverviewFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onSaved?.();
    }
  }, [state.success, router, onSaved]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="supplier_code">Supplier ID</Label>
          <Input
            id="supplier_code"
            value={supplier.supplier_code}
            disabled
            readOnly
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Input
            id="status"
            value={supplier.status === "active" ? "Active" : "Inactive"}
            disabled
            readOnly
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="supplier_name">Supplier name</Label>
          <Input
            id="supplier_name"
            name="supplier_name"
            required
            defaultValue={supplier.supplier_name}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={supplier.phone ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={supplier.email ?? ""}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            defaultValue={supplier.address ?? ""}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            name="notes"
            defaultValue={supplier.notes ?? ""}
          />
        </div>
      </div>

      {state.error ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="text-sm text-emerald-700" role="status">
          Supplier updated.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
