"use client";

import Link from "next/link";
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
import { mapAuthError } from "@/lib/auth/error-messages";
import { recordLoginSessionAction } from "@/lib/actions/auth";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/client";
import { terranaColors } from "@/lib/theme";

type LoginFormProps = {
  initialError?: string | null;
  initialMessage?: string | null;
  redirectTo?: string;
};

function focusPasswordField() {
  requestAnimationFrame(() => {
    document.getElementById("password")?.focus();
  });
}

export function LoginForm({
  initialError = null,
  initialMessage = null,
  redirectTo = "/dashboard",
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [phase, setPhase] = useState<"idle" | "signing_in" | "redirecting">(
    "idle",
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPhase("signing_in");

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword(
        {
          email: email.trim(),
          password,
        },
      );

      if (signInError) {
        setError(mapAuthError(signInError.message));
        setPassword("");
        setPhase("idle");
        focusPasswordField();
        return;
      }

      if (data.user) {
        const { data: appUser } = await supabase
          .from("users")
          .select("status")
          .eq("id", data.user.id)
          .maybeSingle();

        if (appUser?.status === "disabled") {
          await supabase.auth.signOut();
          setError(
            "Your account has been disabled. Contact an administrator.",
          );
          setPassword("");
          setPhase("idle");
          focusPasswordField();
          return;
        }
      }

      setPhase("redirecting");

      void recordLoginSessionAction();

      const destination = safeRedirectPath(redirectTo);
      window.location.replace(destination);
    } catch {
      setError("Sign in failed. Check your connection and try again.");
      setPassword("");
      setPhase("idle");
      focusPasswordField();
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
          <CardTitle className="text-2xl">Terrana ERP</CardTitle>
          <CardDescription>
            Sign in to Terrana Africa operations platform
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isBusy}
              placeholder="you@terranaafrica.com"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/login/forgot-password"
                className="text-xs text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isBusy}
            />
          </div>
          {initialMessage ? (
            <p
              className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200"
              role="status"
            >
              {initialMessage}
            </p>
          ) : null}
          {error ? (
            <p
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isBusy}>
            {phase === "signing_in"
              ? "Checking password..."
              : phase === "redirecting"
                ? "Opening dashboard..."
                : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
