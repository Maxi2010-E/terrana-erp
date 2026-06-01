"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserFormState } from "@/lib/actions/users";

type ResetUserPasswordFormProps = {
  action: (state: UserFormState, formData: FormData) => Promise<UserFormState>;
  userId: string;
  email: string;
};

export function ResetUserPasswordForm({
  action,
  userId,
  email,
}: ResetUserPasswordFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state.success) {
      router.push("/users");
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="user_id" value={userId} />

      <p className="text-sm text-muted-foreground">
        Set a new password for <strong>{email}</strong>. No email is sent — the
        user signs in with this password immediately.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm_password">Confirm password</Label>
          <Input
            id="confirm_password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
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

      <Button type="submit" disabled={pending}>
        {pending ? "Saving password…" : "Update password"}
      </Button>
    </form>
  );
}
