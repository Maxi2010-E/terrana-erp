"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { markPayrollLinePaid } from "@/lib/actions/payroll";

type PayrollMarkPaidButtonProps = {
  lineId: string;
  size?: "default" | "sm";
};

export function PayrollMarkPaidButton({
  lineId,
  size = "sm",
}: PayrollMarkPaidButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <Button
        type="button"
        size={size}
        variant="destructive"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await markPayrollLinePaid(lineId);
            if (result.error) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? "Saving…" : "Mark paid"}
      </Button>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
