"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mapAuthError } from "@/lib/auth/error-messages";
import { createClient } from "@/lib/supabase/client";

type ChangePasswordFormProps = {
  email: string;
};

export function ChangePasswordForm({ email }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "saving" | "redirecting">("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (password === currentPassword) {
      setError("Choose a different password from your current one.");
      return;
    }

    setPhase("saving");

    try {
      const supabase = createClient();

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (verifyError) {
        setError(mapAuthError(verifyError.message));
        setPhase("idle");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(mapAuthError(updateError.message));
        setPhase("idle");
        return;
      }

      await supabase.auth.signOut();

      setPhase("redirecting");
      window.location.replace("/login?message=password_updated");
    } catch {
      setError("Could not update password. Try again.");
      setPhase("idle");
    }
  }

  const isBusy = phase !== "idle";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Signed in as <strong>{email}</strong>. Enter your current password, then
        choose a new one. You will sign in again with the new password.
      </p>

      <div className="grid gap-4 md:max-w-md">
        <div className="space-y-2">
          <Label htmlFor="current_password">Current password</Label>
          <Input
            id="current_password"
            name="current_password"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            disabled={isBusy}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isBusy}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm_password">Confirm new password</Label>
          <Input
            id="confirm_password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={isBusy}
          />
        </div>
      </div>

      {error ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive md:max-w-md"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isBusy}>
        {phase === "saving"
          ? "Updating password…"
          : phase === "redirecting"
            ? "Redirecting to sign in…"
            : "Update password"}
      </Button>
    </form>
  );
}
