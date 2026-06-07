"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { terranaColors } from "@/lib/theme";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "saving" | "redirecting">("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setPhase("saving");

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        setPhase("idle");
        return;
      }

      await supabase.auth.signOut();

      setPhase("redirecting");
      window.location.replace("/login?message=password_updated");
    } catch {
      setError("Could not update password. Try again or request a new reset link.");
      setPhase("idle");
    }
  }

  const isBusy = phase !== "idle";

  return (
    <Card className="w-full max-w-md border-border/60 shadow-xl">
      <CardHeader className="space-y-3 border-b bg-muted/30 pb-6">
        <div
          className="flex size-11 items-center justify-center rounded-lg text-lg font-bold"
          style={{
            backgroundColor: terranaColors.brand,
            color: terranaColors.brandForeground,
          }}
        >
          T
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl">Choose a new password</CardTitle>
          <CardDescription>
            Enter a new password for your Terrana ERP account
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isBusy}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={isBusy}
            />
          </div>
          {error ? (
            <p
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isBusy}>
            {phase === "saving"
              ? "Saving password..."
              : phase === "redirecting"
                ? "Redirecting to sign in..."
                : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
