"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SupplierFormState } from "@/lib/actions/suppliers";

type SupplierCreateFormProps = {
  action: (
    state: SupplierFormState,
    formData: FormData,
  ) => Promise<SupplierFormState>;
};

export function SupplierCreateForm({ action }: SupplierCreateFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state.success) {
      router.push("/suppliers?message=created");
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        Supplier ID (e.g. SUP-2026-00001) is assigned automatically when you save.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="supplier_name">Supplier name</Label>
          <Input id="supplier_name" name="supplier_name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" name="notes" />
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

      <Button type="submit" disabled={pending || state.success}>
        {pending || state.success ? "Saving…" : "Create supplier"}
      </Button>
    </form>
  );
}
