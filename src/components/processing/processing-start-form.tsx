"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ProductTypeBadge } from "@/components/procurement/product-type-badge";
import { Button } from "@/components/ui/button";
import { FormSectionLabel } from "@/components/ui/form-section-label";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startProcessingSession } from "@/lib/actions/processing";
import type { EmployeeOption } from "@/lib/procurement/types";
import {
  INITIAL_PROCESSING_FORM_STATE,
  type ProcessingFormState,
} from "@/lib/processing/form-state";
import type { ProcessingBatchOption } from "@/lib/processing/types";

const selectClassName =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type ProcessingStartFormProps = {
  batch: ProcessingBatchOption;
  employees: EmployeeOption[];
};

export function ProcessingStartForm({
  batch,
  employees,
}: ProcessingStartFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    ProcessingFormState,
    FormData
  >(startProcessingSession, INITIAL_PROCESSING_FORM_STATE);

  const [processingDate, setProcessingDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [bagsSent, setBagsSent] = useState(String(batch.bags_remaining));
  const [processedBy, setProcessedBy] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (state.success && state.sessionId) {
      router.push(`/processing/${state.sessionId}?message=submitted`);
      router.refresh();
    }
  }, [state.success, state.sessionId, router]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="source_batch_id" value={batch.id} />

      <section className="rounded-xl border bg-muted/20 px-4 py-3 text-sm">
        <p>
          Batch: <strong>{batch.batch_number}</strong>
        </p>
        <div className="mt-1">
          <ProductTypeBadge productType={batch.product_type} />
        </div>
        <p className="mt-1 tabular-nums">
          {batch.bags_remaining.toLocaleString()} bag(s) available
        </p>
      </section>

      <section className="space-y-3">
        <FormSectionLabel>Session details</FormSectionLabel>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="processing_date">Processing date</Label>
            <Input
              id="processing_date"
              name="processing_date"
              type="date"
              required
              value={processingDate}
              onChange={(event) => setProcessingDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bags_sent">Bags sent to processing</Label>
            <Input
              id="bags_sent"
              name="bags_sent"
              type="number"
              min={1}
              max={batch.bags_remaining}
              required
              value={bagsSent}
              onChange={(event) => setBagsSent(event.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="processed_by">Processed by</Label>
            <select
              id="processed_by"
              name="processed_by"
              className={selectClassName}
              value={processedBy}
              onChange={(event) => setProcessedBy(event.target.value)}
            >
              <option value="">Select employee…</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              name="notes"
              placeholder="Optional notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>
      </section>

      {state.error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Submitting…" : "Submit for approval"}
        </Button>
      </div>
    </form>
  );
}
