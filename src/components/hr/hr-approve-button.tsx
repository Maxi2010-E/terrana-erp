"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  approveAdvanceRecord,
  approveBonusRecord,
  approveLeaveRecord,
} from "@/lib/actions/payroll";

type HrApproveButtonProps = {
  recordId: string;
  kind: "leave" | "advance" | "bonus";
  size?: "default" | "sm";
};

export function HrApproveButton({
  recordId,
  kind,
  size = "sm",
}: HrApproveButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <Button
        type="button"
        size={size}
        variant="outline"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              if (kind === "leave") {
                await approveLeaveRecord(recordId);
              } else if (kind === "advance") {
                await approveAdvanceRecord(recordId);
              } else {
                await approveBonusRecord(recordId);
              }
              router.refresh();
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Something went wrong.",
              );
            }
          });
        }}
      >
        {pending ? "Approving…" : "Approve"}
      </Button>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
