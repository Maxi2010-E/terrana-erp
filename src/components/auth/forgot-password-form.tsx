"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
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
import { createClient } from "@/lib/supabase/client";
import { terranaColors } from "@/lib/theme";

export function ForgotPasswordForm({
  initialError = null,
}: {
  initialError?: string | null;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/login/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo },
      );

      if (resetError) {
        setError(mapAuthError(resetError.message));
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
    } catch {
      setError("Could not send reset email. Check your connection and try again.");
      setLoading(false);
    }
  }

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
          <CardTitle className="text-2xl">Reset password</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a reset link
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="space-y-4">
            <p
              className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200"
              role="status"
            >
              If an account exists for <strong>{email.trim()}</strong>, a reset
              link is on its way. Check your inbox and spam folder.
            </p>
            <LinkButton variant="outline" className="w-full" href="/login">
              Back to sign in
            </LinkButton>
          </div>
        ) : (
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
                disabled={loading}
                placeholder="you@terranaafrica.com"
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending link..." : "Send reset link"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
