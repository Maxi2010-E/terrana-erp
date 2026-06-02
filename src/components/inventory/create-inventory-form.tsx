"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";

import { GradingVarianceAlerts } from "@/components/inventory/grading-variance-alerts";
import { ProductTypeBadge } from "@/components/procurement/product-type-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createInventoryBatch,
  type CreateInventoryFormState,
} from "@/lib/actions/inventory";
import {
  buildGradedProductType,
  describeGradedCombination,
  proportionalKg,
} from "@/lib/inventory/graded-product-type";
import {
  EXPORT_STANDARD_KG_PER_BAG,
  nominalExportKg,
} from "@/lib/inventory/grading-variance";
import { formatPreStockNumber } from "@/lib/inventory/inventory-number";
import type { AvailablePreStockOption } from "@/lib/inventory/types";

type CreateInventoryFormProps = {
  options: AvailablePreStockOption[];
};

type GradeLineState = {
  preStockId: string;
  bags: string;
};

const initialState: CreateInventoryFormState = {};

export function CreateInventoryForm({ options }: CreateInventoryFormProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    createInventoryBatch,
    initialState,
  );
  const [lines, setLines] = useState<GradeLineState[]>([]);
  const [productFilter, setProductFilter] = useState<string>("all");
  const [outputBags, setOutputBags] = useState("");
  const [outputKg, setOutputKg] = useState("");
  const [outputKgManual, setOutputKgManual] = useState(false);

  const optionById = useMemo(
    () => new Map(options.map((option) => [option.id, option])),
    [options],
  );

  const productTypes = useMemo(
    () => [...new Set(options.map((option) => option.product_type))].sort(),
    [options],
  );

  const filteredOptions = useMemo(() => {
    if (productFilter === "all") {
      return options;
    }
    return options.filter((option) => option.product_type === productFilter);
  }, [options, productFilter]);

  const activeLines = useMemo(
    () =>
      lines
        .map((line) => {
          const option = optionById.get(line.preStockId);
          if (!option) {
            return null;
          }

          const bags = Number.parseInt(line.bags, 10);
          if (!Number.isFinite(bags) || bags <= 0) {
            return null;
          }

          return {
            preStockId: line.preStockId,
            bags: Math.min(bags, option.bags),
            option,
          };
        })
        .filter((line): line is NonNullable<typeof line> => line != null),
    [lines, optionById],
  );

  const previewName = useMemo(
    () =>
      buildGradedProductType(
        activeLines.map((line) => line.option.product_type),
      ),
    [activeLines],
  );

  const previewHint = useMemo(
    () =>
      describeGradedCombination(
        activeLines.map((line) => line.option.product_type),
      ),
    [activeLines],
  );

  const inputTotals = useMemo(
    () =>
      activeLines.reduce(
        (acc, line) => ({
          bags: acc.bags + line.bags,
          total_kg:
            acc.total_kg +
            proportionalKg(line.bags, line.option.bags, line.option.total_kg),
        }),
        { bags: 0, total_kg: 0 },
      ),
    [activeLines],
  );

  const parsedOutputBags = Number.parseInt(outputBags, 10);
  const parsedOutputKg = Number.parseFloat(outputKg);
  const hasValidOutput =
    Number.isFinite(parsedOutputBags) &&
    parsedOutputBags > 0 &&
    Number.isFinite(parsedOutputKg) &&
    parsedOutputKg > 0;

  const nominalKg = hasValidOutput ? nominalExportKg(parsedOutputBags) : 0;

  const gradeLinesJson = useMemo(
    () =>
      JSON.stringify(
        activeLines.map((line) => ({
          preStockId: line.preStockId,
          bags: line.bags,
        })),
      ),
    [activeLines],
  );

  useEffect(() => {
    if (state.success && state.batchId) {
      router.push(`/inventory/export/${state.batchId}?message=created`);
      router.refresh();
    }
  }, [state.success, state.batchId, router]);

  function addLine(preStockId: string) {
    setLines((current) => {
      if (current.some((line) => line.preStockId === preStockId)) {
        return current;
      }

      const option = optionById.get(preStockId);
      return [
        ...current,
        {
          preStockId,
          bags: option ? String(option.bags) : "",
        },
      ];
    });
  }

  function removeLine(preStockId: string) {
    setLines((current) =>
      current.filter((line) => line.preStockId !== preStockId),
    );
  }

  function updateBags(preStockId: string, bags: string) {
    setLines((current) =>
      current.map((line) =>
        line.preStockId === preStockId ? { ...line, bags } : line,
      ),
    );
  }

  function handleOutputBagsChange(value: string) {
    setOutputBags(value);
    const bags = Number.parseInt(value, 10);
    if (!outputKgManual && Number.isFinite(bags) && bags > 0) {
      setOutputKg(String(nominalExportKg(bags)));
    }
  }

  function handleOutputKgChange(value: string) {
    setOutputKgManual(true);
    setOutputKg(value);
  }

  const today = new Date().toISOString().slice(0, 10);

  if (options.length === 0) {
    return (
      <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
        No available pre-stock records. Complete processing or approve clean
        on-site procurement with pre-stock, then return here to grade export
        inventory.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="grade_lines" value={gradeLinesJson} />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Label>Pre-mix input — bags from pre-stock</Label>
          {productTypes.length > 1 ? (
            <select
              value={productFilter}
              onChange={(event) => setProductFilter(event.target.value)}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="all">All product types</option>
              {productTypes.map((productType) => (
                <option key={productType} value={productType}>
                  {productType}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <p className="text-sm text-muted-foreground">
          Select what goes into the mix. Bag and KG totals here are pre-mix only
          — you weigh again after mixing and re-bagging to 25 kg export bags.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-border/60">
          <table className="w-full min-w-[880px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground">
                <th className="px-4 py-3 text-xs font-medium uppercase">
                  Pre-stock
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase">
                  Source
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase">
                  Product
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase">
                  Available
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase">
                  Bags to grade
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOptions.map((option) => {
                const existing = lines.find(
                  (line) => line.preStockId === option.id,
                );

                return (
                  <tr
                    key={option.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium tabular-nums">
                      {formatPreStockNumber(option.pre_stock_number)}
                    </td>
                    <td className="px-4 py-3">{option.source_label}</td>
                    <td className="px-4 py-3">
                      <ProductTypeBadge productType={option.product_type} />
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {option.bags.toLocaleString()} /{" "}
                      {option.bags_received.toLocaleString()} bags
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {option.total_kg.toLocaleString()} kg avail.
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {existing ? (
                        <Input
                          type="number"
                          min={1}
                          max={option.bags}
                          value={existing.bags}
                          onChange={(event) =>
                            updateBags(option.id, event.target.value)
                          }
                          className="h-9 w-28 tabular-nums"
                        />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {existing ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeLine(option.id)}
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addLine(option.id)}
                        >
                          Add
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {activeLines.length > 0 ? (
        <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
          <p className="font-medium">
            Pre-mix input: {inputTotals.bags.toLocaleString()} bags ·{" "}
            {inputTotals.total_kg.toLocaleString()} kg
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span>Export name:</span>
            <ProductTypeBadge productType={previewName} />
          </div>
          <p className="mt-2 text-muted-foreground">{previewHint}</p>
        </div>
      ) : null}

      {activeLines.length > 0 ? (
        <div className="space-y-4 rounded-2xl border border-border/60 px-4 py-4">
          <div>
            <Label>Post-mix export output</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              After mixing and re-bagging to {EXPORT_STANDARD_KG_PER_BAG} kg
              export standard, enter the actual bag count and total KG weighed.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="output_bags">Export bags after mix</Label>
              <Input
                id="output_bags"
                name="output_bags"
                type="number"
                min={1}
                value={outputBags}
                onChange={(event) => handleOutputBagsChange(event.target.value)}
                required
                className="tabular-nums"
                placeholder="e.g. 22"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="output_kg">Total export KG after mix</Label>
              <Input
                id="output_kg"
                name="output_kg"
                type="number"
                min={0.001}
                step="0.001"
                value={outputKg}
                onChange={(event) => handleOutputKgChange(event.target.value)}
                required
                className="tabular-nums"
                placeholder={`e.g. ${EXPORT_STANDARD_KG_PER_BAG * 22}`}
              />
              {hasValidOutput ? (
                <p className="text-xs text-muted-foreground">
                  {parsedOutputBags.toLocaleString()} ×{" "}
                  {EXPORT_STANDARD_KG_PER_BAG} kg standard ={" "}
                  {nominalKg.toLocaleString()} kg
                </p>
              ) : null}
            </div>
          </div>

          {hasValidOutput ? (
            <GradingVarianceAlerts
              inputBags={inputTotals.bags}
              inputKg={inputTotals.total_kg}
              outputBags={parsedOutputBags}
              outputKg={parsedOutputKg}
            />
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date_graded">Date graded</Label>
          <Input
            id="date_graded"
            name="date_graded"
            type="date"
            defaultValue={today}
            required
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Input id="notes" name="notes" placeholder="Grading notes…" />
        </div>
      </div>

      {state.error ? (
        <p
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={pending || activeLines.length === 0 || !hasValidOutput}
      >
        {pending ? "Creating…" : "Create export inventory batch"}
      </Button>
    </form>
  );
}
