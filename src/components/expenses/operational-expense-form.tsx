"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOperationalExpense } from "@/lib/actions/expenses";
import { formatNaira } from "@/lib/currency";
import {
  EXPENSE_PAYMENT_METHODS,
  EXPENSE_PAYMENT_METHOD_LABELS,
  OPERATIONAL_EXPENSE_TYPES,
  OPERATIONAL_EXPENSE_TYPE_LABELS,
  type OperationalExpenseType,
} from "@/lib/expenses/constants";
import {
  calcOperationalTotal,
  OPERATIONAL_EXPENSE_LINK_RULES,
} from "@/lib/expenses/link-rules";
import type {
  ExpenseLinkOption,
  InventoryExpenseLinkOption,
  PreStockExpenseLinkOption,
  ProcurementExpenseLinkOption,
  ProcessingExpenseLinkOption,
  ShipmentExpenseLinkOption,
} from "@/lib/expenses/types";

const selectClassName =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const textareaClassName =
  "flex min-h-20 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type OperationalExpenseFormProps = {
  cleaningProcessingSessions: ProcessingExpenseLinkOption[];
  fieldTransferOutProcessingSessions: ProcessingExpenseLinkOption[];
  processingSessions: ExpenseLinkOption[];
  inventoryBatches: InventoryExpenseLinkOption[];
  offSiteProcurement: ProcurementExpenseLinkOption[];
  preStock: PreStockExpenseLinkOption[];
  shipments: ShipmentExpenseLinkOption[];
  defaultExpenseType?: OperationalExpenseType;
  onSuccess: () => void;
};

function linkFieldName(
  expenseType: OperationalExpenseType,
): string | null {
  const rule = OPERATIONAL_EXPENSE_LINK_RULES[expenseType];
  return rule.requiredField;
}

export function OperationalExpenseForm({
  cleaningProcessingSessions,
  fieldTransferOutProcessingSessions,
  processingSessions,
  inventoryBatches,
  offSiteProcurement,
  preStock,
  shipments,
  defaultExpenseType = "cleaning",
  onSuccess,
}: OperationalExpenseFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [expenseType, setExpenseType] = useState<OperationalExpenseType>(
    defaultExpenseType,
  );
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [linkId, setLinkId] = useState("");
  const [description, setDescription] = useState("");
  const [bags, setBags] = useState("");
  const [ratePerBag, setRatePerBag] = useState("");

  const rule = OPERATIONAL_EXPENSE_LINK_RULES[expenseType];
  const isCleaning = expenseType === "cleaning";
  const isFieldTransferOut = expenseType === "field_transfer_out";
  const isFieldTransferIn = expenseType === "field_transfer_in";
  const isGrading = expenseType === "grading";
  const isTruckOffloading = expenseType === "truck_offloading";
  const isWarehouseLoading = expenseType === "warehouse_loading";
  const isMiscellaneous = expenseType === "miscellaneous";
  const usesProcessingSessionLink = isCleaning || isFieldTransferOut;
  const isBagsAutoFilled =
    usesProcessingSessionLink ||
    isGrading ||
    isTruckOffloading ||
    isFieldTransferIn ||
    isWarehouseLoading;
  const linkOptions = useMemo(() => {
    if (isCleaning) {
      return cleaningProcessingSessions;
    }

    if (isFieldTransferOut) {
      return fieldTransferOutProcessingSessions;
    }

    switch (rule.loaderKey) {
      case "processing":
        return processingSessions;
      case "inventory":
        return inventoryBatches;
      case "off_site_procurement":
        return offSiteProcurement;
      case "pre_stock":
        return preStock;
      case "shipment":
        return shipments;
      default:
        return [];
    }
  }, [
    isCleaning,
    isFieldTransferOut,
    rule.loaderKey,
    cleaningProcessingSessions,
    fieldTransferOutProcessingSessions,
    processingSessions,
    inventoryBatches,
    offSiteProcurement,
    preStock,
    shipments,
  ]);

  function handleLinkChange(nextLinkId: string) {
    setLinkId(nextLinkId);

    if (isCleaning && nextLinkId) {
      const selected = cleaningProcessingSessions.find(
        (option) => option.id === nextLinkId,
      );
      if (selected) {
        setBags(String(selected.bagsSent));
      }
      return;
    }

    if (isFieldTransferOut && nextLinkId) {
      const selected = fieldTransferOutProcessingSessions.find(
        (option) => option.id === nextLinkId,
      );
      if (selected) {
        setBags(String(selected.bagsSent));
      }
      return;
    }

    if (isGrading && nextLinkId) {
      const selected = inventoryBatches.find((option) => option.id === nextLinkId);
      if (selected) {
        setBags(String(selected.bags));
      }
      return;
    }

    if (isTruckOffloading && nextLinkId) {
      const selected = offSiteProcurement.find((option) => option.id === nextLinkId);
      if (selected) {
        setBags(String(selected.bags));
      }
      return;
    }

    if (isFieldTransferIn && nextLinkId) {
      const selected = preStock.find((option) => option.id === nextLinkId);
      if (selected) {
        setBags(String(selected.bags));
      }
      return;
    }

    if (isWarehouseLoading && nextLinkId) {
      const selected = shipments.find((option) => option.id === nextLinkId);
      if (selected) {
        setBags(String(selected.bags));
      }
      return;
    }

    if (!nextLinkId) {
      setBags("");
    }
  }

  const totalPreview = useMemo(() => {
    const bagCount = Number.parseInt(bags, 10);
    const rate = Number.parseFloat(ratePerBag);
    if (!Number.isFinite(bagCount) || bagCount <= 0) {
      return null;
    }
    if (!Number.isFinite(rate) || rate < 0) {
      return null;
    }
    return calcOperationalTotal(bagCount, rate);
  }, [bags, ratePerBag]);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("expense_type", expenseType);
    formData.set("payment_method", paymentMethod);
    formData.set("bags", bags);
    formData.set("rate_per_bag", ratePerBag);
    formData.set("description", description);

    const fieldName = linkFieldName(expenseType);
    if (fieldName) {
      formData.set(fieldName, linkId);
    }

    const result = await createOperationalExpense(formData);
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    onSuccess();
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="operational_expense_type">Expense type</Label>
        <select
          id="operational_expense_type"
          value={expenseType}
          onChange={(event) => {
            setExpenseType(event.target.value as OperationalExpenseType);
            setLinkId("");
            setDescription("");
            setBags("");
          }}
          className={selectClassName}
        >
          {OPERATIONAL_EXPENSE_TYPES.map((value) => {
            const typeRule = OPERATIONAL_EXPENSE_LINK_RULES[value];
            return (
              <option key={value} value={value} disabled={typeRule.disabled}>
                {OPERATIONAL_EXPENSE_TYPE_LABELS[value]}
                {typeRule.disabled ? " (coming soon)" : ""}
              </option>
            );
          })}
        </select>
        {rule.disabled ? (
          <p className="text-sm text-muted-foreground">{rule.disabledReason}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="operational_expense_date">Date</Label>
        <Input
          id="operational_expense_date"
          name="expense_date"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          required
        />
      </div>

      {rule.requiredField && !rule.disabled ? (
        <div className="space-y-2">
          <Label htmlFor="operational_link_id">
            {usesProcessingSessionLink ? "Processing session" : "Linked record"}
          </Label>
          <select
            id="operational_link_id"
            value={linkId}
            onChange={(event) => handleLinkChange(event.target.value)}
            className={selectClassName}
            required
          >
            <option value="">
              {usesProcessingSessionLink
                ? "Select processing session"
                : "Select linked record"}
            </option>
            {linkOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          {isCleaning ? (
            <p className="text-sm text-muted-foreground">
              Only completed processing sessions without a cleaning expense appear
              here. Bags sent are filled automatically from the session.
            </p>
          ) : null}
          {isFieldTransferOut ? (
            <p className="text-sm text-muted-foreground">
              Only completed processing sessions without a field transfer out
              expense appear here. Bags transferred are filled automatically from
              the session.
            </p>
          ) : null}
          {isGrading ? (
            <p className="text-sm text-muted-foreground">
              Select graded export stock. Bag count is filled automatically from
              the inventory batch.
            </p>
          ) : null}
          {isTruckOffloading ? (
            <p className="text-sm text-muted-foreground">
              Approved off-site batches without truck offloading appear here.
              Bags are filled from the procurement batch.
            </p>
          ) : null}
          {isFieldTransferIn ? (
            <p className="text-sm text-muted-foreground">
              Pre-stock records without a field transfer in expense appear here.
              Bags received are filled automatically. Processing waste returned
              to the warehouse will be added when the Waste management module
              is built (planned after Phase 8/9).
            </p>
          ) : null}
          {isWarehouseLoading ? (
            <p className="text-sm text-muted-foreground">
              Loaded or in-transit shipments without a warehouse loading expense
              appear here. Bags are filled from shipment inventory.
            </p>
          ) : null}
          {linkOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isCleaning
                ? "No processing sessions are awaiting a cleaning expense."
                : isFieldTransferOut
                  ? "No processing sessions are awaiting a field transfer out expense."
                  : isGrading
                    ? "No inventory batches are awaiting a grading expense."
                    : isTruckOffloading
                      ? "No off-site batches are awaiting truck offloading."
                      : isFieldTransferIn
                        ? "No pre-stock records are awaiting a field transfer in expense."
                        : isWarehouseLoading
                          ? "No shipments are awaiting a warehouse loading expense."
                          : "No linked records available for this expense type yet."}
            </p>
          ) : null}
        </div>
      ) : null}

      {isMiscellaneous ? (
        <div className="space-y-2">
          <Label htmlFor="operational_description">Description</Label>
          <Input
            id="operational_description"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What was this expense for?"
            required
          />
          <p className="text-sm text-muted-foreground">
            Required for miscellaneous expenses so approvers know what was paid
            for.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="operational_bags">
            {isCleaning
              ? "Bags sent"
              : isFieldTransferOut
                ? "Bags transferred"
                : isFieldTransferIn
                  ? "Bags received"
                  : isTruckOffloading
                    ? "Bags offloaded"
                    : isWarehouseLoading
                      ? "Bags loaded"
                      : isGrading
                      ? "Bags in stock"
                      : "Bags"}
          </Label>
          <Input
            id="operational_bags"
            type="number"
            min="1"
            step="1"
            value={bags}
            onChange={(event) => setBags(event.target.value)}
            readOnly={isBagsAutoFilled && Boolean(linkId)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="operational_rate">Rate per bag</Label>
          <Input
            id="operational_rate"
            type="number"
            min="0"
            step="0.01"
            value={ratePerBag}
            onChange={(event) => setRatePerBag(event.target.value)}
            required
          />
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm">
        <span className="text-muted-foreground">Total: </span>
        <span className="font-medium">
          {totalPreview != null ? formatNaira(totalPreview) : "—"}
        </span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="operational_payment_method">Payment method</Label>
        <select
          id="operational_payment_method"
          value={paymentMethod}
          onChange={(event) => setPaymentMethod(event.target.value)}
          className={selectClassName}
        >
          {EXPENSE_PAYMENT_METHODS.map((value) => (
            <option key={value} value={value}>
              {EXPENSE_PAYMENT_METHOD_LABELS[value]}
            </option>
          ))}
        </select>
        <p className="text-sm text-muted-foreground">
          Cash is paid from petty cash when an admin approves this expense.
          Transfer does not affect petty cash.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="operational_notes">Notes</Label>
        <textarea
          id="operational_notes"
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

      <Button
        type="submit"
        disabled={
          pending ||
          rule.disabled ||
          (isMiscellaneous && !description.trim()) ||
          (rule.requiredField
            ? !linkId ||
              linkOptions.length === 0 ||
              (isBagsAutoFilled && !bags)
            : false)
        }
        className="w-full"
      >
        {pending ? "Saving…" : "Submit for approval"}
      </Button>
    </form>
  );
}
