"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FumigationChamberFormState } from "@/lib/actions/fumigation-chambers";
import type { FumigationChamber } from "@/lib/logistics/types";

type FumigationChamberFormProps = {
  action: (
    state: FumigationChamberFormState,
    formData: FormData,
  ) => Promise<FumigationChamberFormState>;
  chamber?: FumigationChamber;
  redirectTo?: string;
};

export function FumigationChamberForm({
  action,
  chamber,
  redirectTo,
}: FumigationChamberFormProps) {
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
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="facility_name">Facility name</Label>
          <Input
            id="facility_name"
            name="facility_name"
            defaultValue={chamber?.facility_name}
            required
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" defaultValue={chamber?.address ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_person">Contact person</Label>
          <Input
            id="contact_person"
            name="contact_person"
            defaultValue={chamber?.contact_person ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={chamber?.phone ?? ""} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="registration_number">Registration number</Label>
          <Input
            id="registration_number"
            name="registration_number"
            defaultValue={chamber?.registration_number ?? ""}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" name="notes" defaultValue={chamber?.notes ?? ""} />
        </div>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending || Boolean(state.success && redirectTo)}>
        {pending ? "Saving…" : chamber ? "Save changes" : "Create facility"}
      </Button>
    </form>
  );
}
