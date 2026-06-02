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
  readOnly?: boolean;
};

export function SupplierOverviewForm({
  action,
  supplier,
  readOnly = false,
}: SupplierOverviewFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state.success) {
      router.push("/suppliers?message=updated");
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={readOnly ? undefined : formAction} className="space-y-4">
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
            disabled={readOnly}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={supplier.phone ?? ""}
            disabled={readOnly}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={supplier.email ?? ""}
            disabled={readOnly}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            defaultValue={supplier.address ?? ""}
            disabled={readOnly}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            name="notes"
            defaultValue={supplier.notes ?? ""}
            disabled={readOnly}
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
          Saving… returning to list
        </p>
      ) : null}

      {!readOnly ? (
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      ) : null}
    </form>
  );
}
