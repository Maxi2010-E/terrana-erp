"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

type ProcurementActionButtonProps = {
  label: string;
  pendingLabel?: string;
  variant?: "default" | "outline";
  action: () => Promise<void>;
  redirectTo: string;
  disabled?: boolean;
  disabledReason?: string;
};

export function ProcurementActionButton({
  label,
  pendingLabel = "Working…",
  variant = "default",
  action,
  redirectTo,
  disabled = false,
  disabledReason,
}: ProcurementActionButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={variant}
        disabled={pending || disabled}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await action();
              router.push(redirectTo);
              router.refresh();
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Something went wrong.",
              );
            }
          });
        }}
      >
        {pending ? pendingLabel : label}
      </Button>
      {disabledReason && disabled ? (
        <p className="text-sm text-amber-800 dark:text-amber-200" role="status">
          {disabledReason}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
