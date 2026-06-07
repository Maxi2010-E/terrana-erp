"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CustomerFormState } from "@/lib/actions/customers";
import {
  FUMIGATION_REQUIREMENTS,
  FUMIGATION_REQUIREMENT_LABELS,
} from "@/lib/logistics/constants";

const selectClassName =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type CustomerCreateFormProps = {
  action: (
    state: CustomerFormState,
    formData: FormData,
  ) => Promise<CustomerFormState>;
};

export function CustomerCreateForm({ action }: CustomerCreateFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state.success) {
      router.push("/logistics?tab=customers&message=created");
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        Customer ID (e.g. CUS-2026-000001) is assigned automatically when you
        save.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="customer_name">Customer name</Label>
          <Input id="customer_name" name="customer_name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" name="country" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fumigation_requirement">Fumigation requirement</Label>
          <select
            id="fumigation_requirement"
            name="fumigation_requirement"
            defaultValue="requires_fumigation"
            className={selectClassName}
          >
            {FUMIGATION_REQUIREMENTS.map((value) => (
              <option key={value} value={value}>
                {FUMIGATION_REQUIREMENT_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_person">Contact person</Label>
          <Input id="contact_person" name="contact_person" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" name="notes" />
        </div>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending || state.success}>
        {pending || state.success ? "Saving…" : "Create customer"}
      </Button>
    </form>
  );
}
