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
import type { Customer } from "@/lib/logistics/types";

const selectClassName =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type CustomerOverviewFormProps = {
  action: (
    state: CustomerFormState,
    formData: FormData,
  ) => Promise<CustomerFormState>;
  customer: Customer;
  onSaved?: () => void;
};

export function CustomerOverviewForm({
  action,
  customer,
  onSaved,
}: CustomerOverviewFormProps) {
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
          <Label htmlFor="customer_code">Customer ID</Label>
          <Input id="customer_code" value={customer.customer_code} readOnly disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Input
            id="status"
            value={customer.status === "active" ? "Active" : "Inactive"}
            readOnly
            disabled
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="customer_name">Customer name</Label>
          <Input
            id="customer_name"
            name="customer_name"
            defaultValue={customer.customer_name}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" name="country" defaultValue={customer.country} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fumigation_requirement">Fumigation requirement</Label>
          <select
            id="fumigation_requirement"
            name="fumigation_requirement"
            defaultValue={customer.fumigation_requirement}
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
          <Input
            id="contact_person"
            name="contact_person"
            defaultValue={customer.contact_person ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={customer.phone ?? ""} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={customer.email ?? ""}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" name="notes" defaultValue={customer.notes ?? ""} />
        </div>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
