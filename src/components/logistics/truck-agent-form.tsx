"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TruckAgentFormState } from "@/lib/actions/truck-agents";
import type { TruckAgent } from "@/lib/logistics/types";

type TruckAgentFormProps = {
  action: (
    state: TruckAgentFormState,
    formData: FormData,
  ) => Promise<TruckAgentFormState>;
  agent?: TruckAgent;
  redirectTo?: string;
};

export function TruckAgentForm({ action, agent, redirectTo }: TruckAgentFormProps) {
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
          <Label htmlFor="agent_name">Agent name</Label>
          <Input
            id="agent_name"
            name="agent_name"
            defaultValue={agent?.agent_name}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={agent?.phone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={agent?.email ?? ""} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" defaultValue={agent?.address ?? ""} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" name="notes" defaultValue={agent?.notes ?? ""} />
        </div>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending || Boolean(state.success && redirectTo)}>
        {pending ? "Saving…" : agent ? "Save changes" : "Create agent"}
      </Button>
    </form>
  );
}
