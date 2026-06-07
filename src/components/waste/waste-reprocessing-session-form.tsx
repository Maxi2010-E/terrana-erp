"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { FormSectionLabel } from "@/components/ui/form-section-label";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  completeWasteReprocessingSession,
  updateWasteReprocessingSession,
} from "@/lib/actions/waste-reprocessing";
import { KG_PER_BAG_OPTIONS } from "@/lib/procurement/constants";
import type { EmployeeOption } from "@/lib/procurement/types";
import {
  calcWasteWeightKg,
  calcYieldPct,
} from "@/lib/processing/calculations";
import {
  DEFAULT_WASTE_KG_PER_BAG,
  WASTE_KG_PER_BAG_OPTIONS,
  WASTE_TYPES,
  WASTE_TYPE_LABELS,
  type WasteType,
} from "@/lib/processing/constants";
import { calcWasteReprocessingOutputKg } from "@/lib/waste/reprocessing-calculations";
import {
  INITIAL_WASTE_REPROCESSING_FORM_STATE,
  type WasteReprocessingFormState,
} from "@/lib/waste/reprocessing-form-state";
import type { WasteReprocessingSessionDetail } from "@/lib/waste/reprocessing-types";

const selectClassName =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type WasteReprocessingSessionFormProps = {
  session: WasteReprocessingSessionDetail;
  employees: EmployeeOption[];
};

function toInputString(value: number | null | undefined): string {
  if (value == null || value <= 0) {
    return "";
  }
  return String(value);
}

export function WasteReprocessingSessionForm({
  session,
  employees,
}: WasteReprocessingSessionFormProps) {
  const router = useRouter();
  const [pendingComplete, startComplete] = useTransition();
  const [completeError, setCompleteError] = useState<string | null>(null);

  const boundUpdate = updateWasteReprocessingSession.bind(null, session.id);
  const boundComplete = completeWasteReprocessingSession.bind(null, session.id);

  const [saveState, saveAction, savePending] = useActionState<
    WasteReprocessingFormState,
    FormData
  >(boundUpdate, INITIAL_WASTE_REPROCESSING_FORM_STATE);

  const isLocked = session.status !== "in_progress";

  const [processingDate, setProcessingDate] = useState(session.processing_date);
  const [processedBy, setProcessedBy] = useState(session.processed_by ?? "");
  const [notes, setNotes] = useState(session.notes ?? "");
  const [bagsProduced, setBagsProduced] = useState(
    toInputString(session.output?.bags_produced),
  );
  const [kgPerBag, setKgPerBag] = useState(
    toInputString(session.output?.kg_per_bag),
  );
  const [extraKg, setExtraKg] = useState(
    session.output?.extra_kg != null ? String(session.output.extra_kg) : "0",
  );
  const [byproductBags, setByproductBags] = useState<Record<WasteType, string>>(
    () =>
      Object.fromEntries(
        WASTE_TYPES.map((type) => [
          type,
          toInputString(session.byproducts[type]?.number_of_bags),
        ]),
      ) as Record<WasteType, string>,
  );
  const [byproductKgPerBag, setByproductKgPerBag] = useState<
    Record<WasteType, string>
  >(
    () =>
      Object.fromEntries(
        WASTE_TYPES.map((type) => [
          type,
          session.byproducts[type]?.kg_per_bag != null
            ? String(session.byproducts[type].kg_per_bag)
            : String(DEFAULT_WASTE_KG_PER_BAG),
        ]),
      ) as Record<WasteType, string>,
  );
  const [byproductExtraKg, setByproductExtraKg] = useState<
    Record<WasteType, string>
  >(
    () =>
      Object.fromEntries(
        WASTE_TYPES.map((type) => [
          type,
          (session.byproducts[type]?.extra_kg ?? 0) > 0
            ? String(session.byproducts[type].extra_kg)
            : "0",
        ]),
      ) as Record<WasteType, string>,
  );

  const byproductPreview = useMemo(() => {
    return Object.fromEntries(
      WASTE_TYPES.map((type) => {
        const kg = Number.parseFloat(byproductKgPerBag[type]);
        return [
          type,
          calcWasteWeightKg({
            number_of_bags: Number.parseInt(byproductBags[type], 10) || 0,
            kg_per_bag: Number.isFinite(kg) ? kg : null,
            extra_kg: Number.parseFloat(byproductExtraKg[type]) || 0,
          }),
        ];
      }),
    ) as Record<WasteType, number>;
  }, [byproductBags, byproductKgPerBag, byproductExtraKg]);

  const outputPreview = useMemo(() => {
    const kg = Number.parseFloat(kgPerBag);
    return calcWasteReprocessingOutputKg({
      bags_produced: Number.parseInt(bagsProduced, 10) || 0,
      kg_per_bag: Number.isFinite(kg) ? kg : null,
      extra_kg: Number.parseFloat(extraKg) || 0,
    });
  }, [bagsProduced, kgPerBag, extraKg]);

  const yieldPreview = useMemo(
    () => calcYieldPct(session.input_kg, outputPreview),
    [session.input_kg, outputPreview],
  );

  const secondaryWasteTotal = useMemo(
    () =>
      WASTE_TYPES.reduce((sum, type) => sum + byproductPreview[type], 0),
    [byproductPreview],
  );

  function appendSharedFields(formData: FormData) {
    formData.set("processing_date", processingDate);
    formData.set("processed_by", processedBy);
    formData.set("notes", notes);
    formData.set("output_bags", bagsProduced);
    formData.set("output_kg_per_bag", kgPerBag);
    formData.set("output_extra_kg", extraKg);
    for (const type of WASTE_TYPES) {
      formData.set(`byproduct_${type}_bags`, byproductBags[type] || "0");
      formData.set(
        `byproduct_${type}_kg_per_bag`,
        byproductKgPerBag[type] || String(DEFAULT_WASTE_KG_PER_BAG),
      );
      formData.set(`byproduct_${type}_extra_kg`, byproductExtraKg[type] || "0");
    }
  }

  function handleComplete() {
    setCompleteError(null);
    startComplete(async () => {
      const formData = new FormData();
      appendSharedFields(formData);
      const result = await boundComplete(
        INITIAL_WASTE_REPROCESSING_FORM_STATE,
        formData,
      );
      if (result.error) {
        setCompleteError(result.error);
        return;
      }
      router.push("/waste?view=processing&message=completed");
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Kg sent</p>
          <p className="text-sm font-medium tabular-nums">
            {session.kg_sent.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Input KG</p>
          <p className="text-sm font-medium tabular-nums">
            {session.input_kg.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Secondary waste preview</p>
          <p className="text-sm font-medium tabular-nums">
            {secondaryWasteTotal.toLocaleString()} kg
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Yield preview</p>
          <p className="text-sm font-medium tabular-nums">{yieldPreview}%</p>
        </div>
      </section>

      {session.local_stock_number ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
          Local stock created: <strong>{session.local_stock_number}</strong>
        </p>
      ) : null}

      <form
        action={(formData) => {
          appendSharedFields(formData);
          return saveAction(formData);
        }}
        className="space-y-8"
      >
        <section className="space-y-3">
          <FormSectionLabel>Session</FormSectionLabel>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="processing_date">Processing date</Label>
              <Input
                id="processing_date"
                name="processing_date"
                type="date"
                required
                readOnly={isLocked}
                value={processingDate}
                onChange={(event) => setProcessingDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="processed_by">Processed by</Label>
              <select
                id="processed_by"
                name="processed_by"
                className={selectClassName}
                disabled={isLocked}
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
                readOnly={isLocked}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <FormSectionLabel>Local product output</FormSectionLabel>
          <p className="text-sm text-muted-foreground">
            Target product:{" "}
            <span className="font-medium text-foreground">
              {session.local_product_label}
            </span>
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="output_bags">Bags produced</Label>
              <Input
                id="output_bags"
                name="output_bags"
                type="number"
                min={0}
                readOnly={isLocked}
                value={bagsProduced}
                onChange={(event) => setBagsProduced(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="output_kg_per_bag">Package (kg per bag)</Label>
              <select
                id="output_kg_per_bag"
                name="output_kg_per_bag"
                className={selectClassName}
                disabled={isLocked}
                value={kgPerBag}
                onChange={(event) => setKgPerBag(event.target.value)}
              >
                <option value="">Select package…</option>
                {KG_PER_BAG_OPTIONS.map((weight) => (
                  <option key={weight} value={weight}>
                    {weight} kg
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="output_extra_kg">Extra KG</Label>
              <Input
                id="output_extra_kg"
                name="output_extra_kg"
                type="number"
                min={0}
                step="0.001"
                readOnly={isLocked}
                value={extraKg}
                onChange={(event) => setExtraKg(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Output total KG</Label>
              <p className="flex h-10 items-center rounded-xl border bg-muted/30 px-3 text-sm tabular-nums">
                {outputPreview.toLocaleString()} kg
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <FormSectionLabel>Secondary waste</FormSectionLabel>
          <p className="text-sm text-muted-foreground">
            Re-processing can still produce waste. Record it here — it returns to
            the re-processing queue for another round when needed.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {WASTE_TYPES.map((type) => (
              <div
                key={type}
                className="space-y-3 rounded-xl border bg-muted/10 p-4"
              >
                <p className="text-sm font-medium">{WASTE_TYPE_LABELS[type]}</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor={`byproduct_${type}_bags`}>Bags</Label>
                    <Input
                      id={`byproduct_${type}_bags`}
                      name={`byproduct_${type}_bags`}
                      type="number"
                      min={0}
                      step={1}
                      readOnly={isLocked}
                      value={byproductBags[type]}
                      onChange={(event) =>
                        setByproductBags((current) => ({
                          ...current,
                          [type]: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`byproduct_${type}_kg_per_bag`}>
                      Package (kg per bag)
                    </Label>
                    <select
                      id={`byproduct_${type}_kg_per_bag`}
                      name={`byproduct_${type}_kg_per_bag`}
                      className={selectClassName}
                      disabled={isLocked}
                      value={byproductKgPerBag[type]}
                      onChange={(event) =>
                        setByproductKgPerBag((current) => ({
                          ...current,
                          [type]: event.target.value,
                        }))
                      }
                    >
                      {WASTE_KG_PER_BAG_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option} kg
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`byproduct_${type}_extra_kg`}>Extra KG</Label>
                    <Input
                      id={`byproduct_${type}_extra_kg`}
                      name={`byproduct_${type}_extra_kg`}
                      type="number"
                      min={0}
                      step="0.001"
                      readOnly={isLocked}
                      value={byproductExtraKg[type]}
                      onChange={(event) =>
                        setByproductExtraKg((current) => ({
                          ...current,
                          [type]: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Total KG</Label>
                  <p className="flex h-10 items-center rounded-xl border bg-muted/30 px-3 text-sm tabular-nums">
                    {byproductPreview[type].toLocaleString()} kg
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {saveState.error ? (
          <p
            className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {saveState.error}
          </p>
        ) : null}

        {saveState.success ? (
          <p
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800"
            role="status"
          >
            Session saved.
          </p>
        ) : null}

        {!isLocked ? (
          <div className="flex flex-wrap gap-2 border-t pt-6">
            <Button type="submit" variant="outline" disabled={savePending}>
              {savePending ? "Saving…" : "Save progress"}
            </Button>
            <Button
              type="button"
              disabled={pendingComplete}
              onClick={handleComplete}
            >
              {pendingComplete ? "Completing…" : "Complete re-processing"}
            </Button>
          </div>
        ) : null}
      </form>

      {!isLocked ? (
        <p className="text-xs text-muted-foreground">
          Completing locks this session, posts clean product to local stock, and
          queues any secondary waste for future re-processing.
        </p>
      ) : null}

      {completeError ? (
        <p
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {completeError}
        </p>
      ) : null}
    </div>
  );
}
