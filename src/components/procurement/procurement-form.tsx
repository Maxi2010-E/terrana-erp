"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ProductTypeBadge } from "@/components/procurement/product-type-badge";
import { Button } from "@/components/ui/button";
import { FormSectionLabel } from "@/components/ui/form-section-label";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { formatNaira } from "@/lib/currency";
import type { ProcurementFormState } from "@/lib/procurement/form-state";
import {
  MIXED_TYPE_LABELS,
  MIXED_TYPES,
  PROCUREMENT_TYPE_LABELS,
  PROCUREMENT_TYPES,
  PRODUCT_AGE_LABELS,
  PRODUCT_AGES,
  PRODUCT_COLOR_LABELS,
  PRODUCT_COLORS,
  PRODUCT_CONDITION_LABELS,
  PRODUCT_CONDITIONS,
  QUALITY_DECISION_LABELS,
  KG_PER_BAG_OPTIONS,
  type ProcurementType,
  type ProductCondition,
  type QualityDecision,
} from "@/lib/procurement/constants";
import {
  buildProductType,
  calcTotalKg,
  calcTotalValue,
} from "@/lib/procurement/product-type";
import {
  isDirectTotalKgRequired,
  isKgPerBagRequired,
  isOffSiteClean,
  isRawProduct,
  showDirectTotalKg,
  showExtraKgField,
  showKgPerBagField,
} from "@/lib/procurement/quantity-rules";
import {
  allowedQualityDecisions,
} from "@/lib/procurement/quality-decision-rules";
import type { EmployeeOption, SupplierOption } from "@/lib/procurement/types";

const selectClassName =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type ProcurementFormProps = {
  action: (
    state: ProcurementFormState,
    formData: FormData,
  ) => Promise<ProcurementFormState>;
  suppliers: SupplierOption[];
  employees: EmployeeOption[];
  canEditPricing: boolean;
  submitLabel: string;
  redirectTo?: string;
  onSuccess?: () => void;
  compact?: boolean;
  initial?: {
    procurement_type?: ProcurementType;
    product_condition?: ProductCondition;
    product_age?: string | null;
    product_color?: string | null;
    mixed_type?: string | null;
    supplier_id?: string;
    number_of_bags?: number;
    kg_per_bag?: number | null;
    extra_kg?: number;
    total_kg?: number;
    unit_price?: number | null;
    procurement_date?: string;
    received_by?: string | null;
    quality_decision?: string;
    notes?: string | null;
  };
};

export function ProcurementForm({
  action,
  suppliers,
  employees,
  canEditPricing,
  submitLabel,
  redirectTo,
  onSuccess,
  compact = false,
  initial,
}: ProcurementFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {});

  const [procurementType, setProcurementType] = useState<ProcurementType>(
    initial?.procurement_type ?? "on_site",
  );
  const [productCondition, setProductCondition] = useState<ProductCondition>(
    initial?.product_condition ?? "clean",
  );
  const [productAge, setProductAge] = useState(initial?.product_age ?? "new");
  const [productColor, setProductColor] = useState(
    initial?.product_color ?? "red",
  );
  const [mixedType, setMixedType] = useState(initial?.mixed_type ?? "red_mixed");
  const [numberOfBags, setNumberOfBags] = useState(
    String(initial?.number_of_bags ?? ""),
  );
  const [kgPerBag, setKgPerBag] = useState(
    initial?.kg_per_bag != null ? String(initial.kg_per_bag) : "",
  );
  const [extraKg, setExtraKg] = useState(String(initial?.extra_kg ?? "0"));
  const [totalKgDirect, setTotalKgDirect] = useState(
    initial?.total_kg != null && !initial?.kg_per_bag
      ? String(initial.total_kg)
      : "",
  );
  const [unitPrice, setUnitPrice] = useState(
    initial?.unit_price != null ? String(initial.unit_price) : "0",
  );
  const [supplierId, setSupplierId] = useState(initial?.supplier_id ?? "");
  const [procurementDate, setProcurementDate] = useState(
    initial?.procurement_date ?? new Date().toISOString().slice(0, 10),
  );
  const [receivedBy, setReceivedBy] = useState(initial?.received_by ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [qualityDecision, setQualityDecision] = useState<QualityDecision | "">(
    () => {
      const condition = initial?.product_condition ?? "clean";
      if (isRawProduct(condition)) {
        return "processing";
      }
      return (initial?.quality_decision as QualityDecision | undefined) ?? "";
    },
  );

  const qualityDecisionOptions = useMemo(
    () => allowedQualityDecisions(productCondition),
    [productCondition],
  );

  const submittedQualityDecision: QualityDecision | "" = isRawProduct(
    productCondition,
  )
    ? "processing"
    : qualityDecision;

  useEffect(() => {
    if (!state.success) {
      return;
    }

    if (onSuccess) {
      onSuccess();
      return;
    }

    if (redirectTo) {
      router.push(redirectTo);
      router.refresh();
    }
  }, [state.success, redirectTo, onSuccess, router]);

  const sectionGap = compact ? "space-y-5" : "space-y-8";

  const kgPerBagValue = Number.parseFloat(kgPerBag);
  const showKgPerBag = showKgPerBagField(productCondition);
  const showExtraKg = showExtraKgField(productCondition);
  const kgPerBagRequired = isKgPerBagRequired(procurementType, productCondition);
  const offSiteClean = isOffSiteClean(procurementType, productCondition);
  const showDirectTotal = showDirectTotalKg(
    procurementType,
    productCondition,
    Number.isFinite(kgPerBagValue) ? kgPerBagValue : null,
  );
  const directTotalRequired = isDirectTotalKgRequired(
    procurementType,
    productCondition,
    Number.isFinite(kgPerBagValue) ? kgPerBagValue : null,
  );
  const showCalculatedTotal =
    !isRawProduct(productCondition) &&
    (!showDirectTotal || (Number.isFinite(kgPerBagValue) && kgPerBagValue > 0));

  const productTypePreview = useMemo(
    () =>
      buildProductType({
        product_condition: productCondition,
        product_age: productCondition === "mixed" ? null : (productAge as "new" | "old"),
        product_color:
          productCondition === "mixed" ? null : (productColor as "red" | "black"),
        mixed_type:
          productCondition === "mixed"
            ? (mixedType as "red_mixed" | "black_mixed" | "combined_mixed")
            : null,
      }),
    [productCondition, productAge, productColor, mixedType],
  );

  const totalKgPreview = useMemo(() => {
    const bags = Number.parseInt(numberOfBags, 10);
    const kg = Number.parseFloat(kgPerBag);
    const extra = Number.parseFloat(extraKg) || 0;
    const direct = Number.parseFloat(totalKgDirect);

    if (!Number.isFinite(bags) || bags <= 0) {
      return 0;
    }

    return calcTotalKg({
      procurement_type: procurementType,
      product_condition: productCondition,
      number_of_bags: bags,
      kg_per_bag: Number.isFinite(kg) ? kg : null,
      extra_kg: extra,
      total_kg_direct: Number.isFinite(direct) ? direct : null,
    });
  }, [
    procurementType,
    productCondition,
    numberOfBags,
    kgPerBag,
    extraKg,
    totalKgDirect,
  ]);

  const totalValuePreview = useMemo(() => {
    const price = Number.parseFloat(unitPrice) || 0;
    return calcTotalValue(totalKgPreview, price);
  }, [totalKgPreview, unitPrice]);

  const kgPerBagNumeric = Number.parseFloat(kgPerBag);
  const legacyKgPerBag =
    Number.isFinite(kgPerBagNumeric) &&
    kgPerBagNumeric > 0 &&
    !KG_PER_BAG_OPTIONS.includes(kgPerBagNumeric as (typeof KG_PER_BAG_OPTIONS)[number])
      ? kgPerBagNumeric
      : null;

  return (
    <form action={formAction} className={sectionGap}>
      <section className="space-y-3">
        <FormSectionLabel>Procurement type</FormSectionLabel>
        <SegmentedControl<ProcurementType>
          name="procurement_type"
          value={procurementType}
          onChange={setProcurementType}
          options={PROCUREMENT_TYPES.map((type) => ({
            value: type,
            label: PROCUREMENT_TYPE_LABELS[type],
          }))}
        />
      </section>

      <section className="space-y-3">
        <FormSectionLabel>Product classification</FormSectionLabel>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="product_condition">Condition</Label>
            <select
              id="product_condition"
              name="product_condition"
              className={selectClassName}
              value={productCondition}
              onChange={(event) => {
                const next = event.target.value as ProductCondition;
                setProductCondition(next);
                if (isRawProduct(next)) {
                  setKgPerBag("");
                  setExtraKg("0");
                  setQualityDecision("processing");
                }
              }}
            >
              {PRODUCT_CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {PRODUCT_CONDITION_LABELS[condition]}
                </option>
              ))}
            </select>
          </div>

          {productCondition === "mixed" ? (
            <div className="space-y-2">
              <Label htmlFor="mixed_type">Mixed type</Label>
              <select
                id="mixed_type"
                name="mixed_type"
                className={selectClassName}
                value={mixedType}
                onChange={(event) => setMixedType(event.target.value)}
              >
                {MIXED_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {MIXED_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="product_age">Age</Label>
                <select
                  id="product_age"
                  name="product_age"
                  className={selectClassName}
                  value={productAge}
                  onChange={(event) => setProductAge(event.target.value)}
                >
                  {PRODUCT_AGES.map((age) => (
                    <option key={age} value={age}>
                      {PRODUCT_AGE_LABELS[age]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product_color">Colour</Label>
                <select
                  id="product_color"
                  name="product_color"
                  className={selectClassName}
                  value={productColor}
                  onChange={(event) => setProductColor(event.target.value)}
                >
                  {PRODUCT_COLORS.map((color) => (
                    <option key={color} value={color}>
                      {PRODUCT_COLOR_LABELS[color]}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed bg-muted/30 px-4 py-3 text-sm">
          <span>Product type:</span>
          <ProductTypeBadge productType={productTypePreview} />
        </div>
      </section>

      <section className="space-y-3">
        <FormSectionLabel>Supplier & quantities</FormSectionLabel>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="supplier_id">Supplier</Label>
            <select
              id="supplier_id"
              name="supplier_id"
              className={selectClassName}
              value={supplierId}
              onChange={(event) => setSupplierId(event.target.value)}
              required
            >
              <option value="" disabled>
                Select supplier…
              </option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.supplier_name} ({supplier.supplier_code})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="number_of_bags">Number of bags</Label>
            <Input
              id="number_of_bags"
              name="number_of_bags"
              type="number"
              min={1}
              required
              value={numberOfBags}
              onChange={(event) => setNumberOfBags(event.target.value)}
            />
          </div>
          {showKgPerBag ? (
            <div className="space-y-2">
              <Label htmlFor="kg_per_bag">
                Package (kg per bag)
                {kgPerBagRequired
                  ? " (required)"
                  : offSiteClean
                    ? " (optional)"
                    : ""}
              </Label>
              <select
                id="kg_per_bag"
                name="kg_per_bag"
                className={selectClassName}
                value={kgPerBag}
                onChange={(event) => setKgPerBag(event.target.value)}
                required={kgPerBagRequired}
              >
                {!kgPerBagRequired ? (
                  <option value="">Not set — use total KG</option>
                ) : (
                  <option value="" disabled>
                    Select package…
                  </option>
                )}
                {KG_PER_BAG_OPTIONS.map((weight) => (
                  <option key={weight} value={weight}>
                    {weight} kg
                  </option>
                ))}
                {legacyKgPerBag != null ? (
                  <option value={legacyKgPerBag}>
                    {legacyKgPerBag} kg (existing)
                  </option>
                ) : null}
              </select>
            </div>
          ) : (
            <input type="hidden" name="kg_per_bag" value="" />
          )}
          {showExtraKg ? (
            <div className="space-y-2">
              <Label htmlFor="extra_kg">
                Extra KG{offSiteClean ? " (optional)" : ""}
              </Label>
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
          ) : (
            <input type="hidden" name="extra_kg" value="0" />
          )}
          {showDirectTotal ? (
            <div className="space-y-2">
              <Label htmlFor="total_kg_direct">
                Total KG
                {directTotalRequired ? " (required)" : " (optional)"}
              </Label>
              <Input
                id="total_kg_direct"
                name="total_kg_direct"
                type="number"
                min={0}
                step="0.001"
                required={directTotalRequired}
                value={totalKgDirect}
                onChange={(event) => setTotalKgDirect(event.target.value)}
              />
            </div>
          ) : null}
          {showCalculatedTotal ? (
            <div className="space-y-2 md:col-span-2">
              <p className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                Calculated total:{" "}
                <strong>{totalKgPreview.toLocaleString()} kg</strong>
              </p>
            </div>
          ) : null}
          {isRawProduct(productCondition) ? (
            <div className="space-y-2 md:col-span-2">
              <p className="rounded-xl border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                Raw products use bag count and total KG only — kg per bag and
                extra KG are not used.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {canEditPricing ? (
        <section className="space-y-3">
          <FormSectionLabel>Pricing</FormSectionLabel>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="unit_price">Unit price (₦ per kg)</Label>
              <Input
                id="unit_price"
                name="unit_price"
                type="number"
                min={0}
                step="0.01"
                value={unitPrice}
                onChange={(event) => setUnitPrice(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Total value</Label>
              <p className="flex h-10 items-center rounded-xl border bg-muted/30 px-3 text-sm tabular-nums">
                {formatNaira(totalValuePreview)}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <input type="hidden" name="unit_price" value="0" />
      )}

      <section className="space-y-3">
        <FormSectionLabel>Receiver & decision</FormSectionLabel>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="procurement_date">Procurement date</Label>
            <Input
              id="procurement_date"
              name="procurement_date"
              type="date"
              required
              value={procurementDate}
              onChange={(event) => setProcurementDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="received_by">Received by</Label>
            <select
              id="received_by"
              name="received_by"
              className={selectClassName}
              value={receivedBy}
              onChange={(event) => setReceivedBy(event.target.value)}
            >
              <option value="">Select employee…</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quality_decision">Quality decision</Label>
            <input
              type="hidden"
              name="quality_decision"
              value={submittedQualityDecision}
            />
            <select
              id="quality_decision"
              className={selectClassName}
              value={submittedQualityDecision}
              onChange={(event) =>
                setQualityDecision(event.target.value as QualityDecision)
              }
              required={!isRawProduct(productCondition)}
              disabled={isRawProduct(productCondition)}
            >
              {qualityDecisionOptions.length > 1 ? (
                <option value="" disabled>
                  Select decision…
                </option>
              ) : null}
              {qualityDecisionOptions.map((decision) => (
                <option key={decision} value={decision}>
                  {QUALITY_DECISION_LABELS[decision]}
                </option>
              ))}
            </select>
            {isRawProduct(productCondition) ? (
              <p className="text-xs text-muted-foreground">
                Raw goods from the farm must be reprocessed before export. They
                always go to processing — never pre-stock.
              </p>
            ) : null}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              name="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>
      </section>

      {state.error ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
