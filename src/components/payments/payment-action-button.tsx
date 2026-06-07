"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  approvePaymentAction,
  unlockPaymentAction,
} from "@/lib/actions/payments";

type PaymentActionButtonProps = {
  paymentId: string;
  action: "approve" | "unlock";
  label: string;
  pendingLabel?: string;
  variant?: "default" | "outline";
  size?: "default" | "sm";
  redirectTo: string;
};

export function PaymentActionButton({
  paymentId,
  action,
  label,
  pendingLabel = "Working…",
  variant = "default",
  size = "default",
  redirectTo,
}: PaymentActionButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              if (action === "approve") {
                await approvePaymentAction(paymentId);
              } else {
                await unlockPaymentAction(paymentId);
              }
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
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
