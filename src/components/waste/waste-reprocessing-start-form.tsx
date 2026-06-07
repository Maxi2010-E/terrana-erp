"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { WasteTypeBadge } from "@/components/waste/waste-type-badge";
import { Button } from "@/components/ui/button";
import { FormSectionLabel } from "@/components/ui/form-section-label";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startWasteReprocessingSession } from "@/lib/actions/waste-reprocessing";
import { calcWasteWeightKg } from "@/lib/processing/calculations";
import {
  DEFAULT_WASTE_KG_PER_BAG,
  WASTE_KG_PER_BAG_OPTIONS,
} from "@/lib/processing/constants";
import type { EmployeeOption } from "@/lib/procurement/types";
import {
  INITIAL_WASTE_REPROCESSING_FORM_STATE,
  type WasteReprocessingFormState,
} from "@/lib/waste/reprocessing-form-state";
import type { WasteReprocessingSourceOption } from "@/lib/waste/reprocessing-types";

const selectClassName =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type WasteReprocessingStartFormProps = {
  source: WasteReprocessingSourceOption;
  employees: EmployeeOption[];
};

export function WasteReprocessingStartForm({
  source,
  employees,
}: WasteReprocessingStartFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    WasteReprocessingFormState,
    FormData
  >(startWasteReprocessingSession, INITIAL_WASTE_REPROCESSING_FORM_STATE);

  const [processingDate, setProcessingDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [numberOfBags, setNumberOfBags] = useState(
    source.number_of_bags > 0 ? String(source.number_of_bags) : "",
  );
  const [kgPerBag, setKgPerBag] = useState(
    source.kg_per_bag != null && source.kg_per_bag > 0
      ? String(source.kg_per_bag)
      : String(DEFAULT_WASTE_KG_PER_BAG),
  );
  const [extraKg, setExtraKg] = useState("0");
  const [kgSent, setKgSent] = useState("");
  const [processedBy, setProcessedBy] = useState("");
  const [notes, setNotes] = useState("");

  const kgPreview = useMemo(() => {
    const direct = Number.parseFloat(kgSent);
    if (Number.isFinite(direct) && direct > 0) {
      return direct;
    }

    const kg = Number.parseFloat(kgPerBag);
    return calcWasteWeightKg({
      number_of_bags: Number.parseInt(numberOfBags, 10) || 0,
      kg_per_bag: Number.isFinite(kg) ? kg : null,
      extra_kg: Number.parseFloat(extraKg) || 0,
    });
  }, [kgSent, numberOfBags, kgPerBag, extraKg]);

  useEffect(() => {
    if (state.success && state.sessionId) {
      router.push(
        `/waste/reprocessing/${state.sessionId}?message=submitted`,
      );
      router.refresh();
    }
  }, [state.success, state.sessionId, router]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="source_id" value={source.source_id} />
      <input type="hidden" name="source_kind" value={source.source_kind} />

      <section className="rounded-xl border bg-muted/20 px-4 py-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <WasteTypeBadge wasteType={source.waste_type} />
          <span className="text-muted-foreground">→</span>
          <span className="font-medium">{source.local_product_label}</span>
        </div>
        <p className="mt-2">
          Origin: <strong>{source.origin_session_number}</strong>
          {source.origin_batch_number !== "—"
            ? ` · ${source.origin_batch_number}`
            : null}
        </p>
        <p className="mt-1 tabular-nums">
          {source.available_kg.toLocaleString()} kg available to send
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
            <Label htmlFor="kg_sent">Kg to send (optional override)</Label>
            <Input
              id="kg_sent"
              name="kg_sent"
              type="number"
              min={0}
              max={source.available_kg}
              step="0.001"
              placeholder="Auto from bags"
              value={kgSent}
              onChange={(event) => setKgSent(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="number_of_bags">Bags sent</Label>
            <Input
              id="number_of_bags"
              name="number_of_bags"
              type="number"
              min={0}
              value={numberOfBags}
              onChange={(event) => setNumberOfBags(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kg_per_bag">Package (kg per bag)</Label>
            <select
              id="kg_per_bag"
              name="kg_per_bag"
              className={selectClassName}
              value={kgPerBag}
              onChange={(event) => setKgPerBag(event.target.value)}
            >
              {WASTE_KG_PER_BAG_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} kg
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="extra_kg">Extra KG</Label>
            <Input
              id="extra_kg"
              name="extra_kg"
              type="number"
              min={0}
              step="0.001"
              value={extraKg}
              onChange={(event) => setExtraKg(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Input total KG</Label>
            <p className="flex h-10 items-center rounded-xl border bg-muted/30 px-3 text-sm tabular-nums">
              {kgPreview.toLocaleString()} kg
            </p>
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
        <p
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
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
