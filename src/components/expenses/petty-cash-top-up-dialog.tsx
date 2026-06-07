"use client";

import { Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addPettyCashTopUp } from "@/lib/actions/expenses";

const textareaClassName =
  "flex min-h-20 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type PettyCashTopUpDialogProps = {
  defaultOpen?: boolean;
  /** Fits the petty cash balance card header. */
  compact?: boolean;
};

export function PettyCashTopUpDialog({
  defaultOpen = false,
  compact = false,
}: PettyCashTopUpDialogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(defaultOpen);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    const result = await addPettyCashTopUp(formData);
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("message", "top_up");
    if (!params.get("tab")) {
      params.set("tab", "daily");
    }
    router.push(`/expenses?${params.toString()}`);
    router.refresh();
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={compact ? "sm" : "lg"}
        onClick={() => setOpen(true)}
      >
        <Plus />
        Add petty cash
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add petty cash</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="top_up_amount">Amount</Label>
                <Input
                  id="top_up_amount"
                  name="amount_added"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="top_up_date">Date</Label>
                <Input
                  id="top_up_date"
                  name="date_added"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="top_up_notes">Notes</Label>
                <textarea
                  id="top_up_notes"
                  name="notes"
                  rows={3}
                  className={textareaClassName}
                />
              </div>
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Saving…" : "Save top-up"}
              </Button>
            </form>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
