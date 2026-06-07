"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { PaymentMethodBadge } from "@/components/payments/payment-method-badge";
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
import {
  getBatchPaymentSummary,
  getOutstandingBatchesForSupplier,
  getSupplierBankAccountsForPayment,
  recordPayment,
} from "@/lib/actions/payments";
import { formatNaira } from "@/lib/currency";
import {
  formatBankAccountLabel,
  pickDefaultBankAccountId,
} from "@/lib/payments/bank-account";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/lib/payments/constants";
import type {
  BatchPaymentOption,
  BatchPaymentSummary,
  PaymentBankAccountSummary,
  SupplierWithOutstandingOption,
} from "@/lib/payments/types";
import { formatProcurementBatchNumber } from "@/lib/procurement/batch-number";

type RecordPrefill = {
  supplierId?: string;
  batchId?: string;
};

type PaymentsRecordContextValue = {
  openRecordPayment: (prefill?: RecordPrefill) => void;
};

const PaymentsRecordContext = createContext<PaymentsRecordContextValue | null>(
  null,
);

export function usePaymentsRecord() {
  const context = useContext(PaymentsRecordContext);
  if (!context) {
    throw new Error("usePaymentsRecord must be used within PaymentsRecordProvider");
  }

  return context;
}

type PaymentsRecordProviderProps = {
  suppliers: SupplierWithOutstandingOption[];
  autoApproveOnSave?: boolean;
  children: ReactNode;
};

export function PaymentsRecordProvider({
  suppliers,
  autoApproveOnSave = false,
  children,
}: PaymentsRecordProviderProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("transfer");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState("");
  const [batches, setBatches] = useState<BatchPaymentOption[]>([]);
  const [bankAccounts, setBankAccounts] = useState<PaymentBankAccountSummary[]>(
    [],
  );
  const [bankAccountId, setBankAccountId] = useState("");
  const [summary, setSummary] = useState<BatchPaymentSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingBatches, startBatchTransition] = useTransition();
  const [loadingSummary, startSummaryTransition] = useTransition();
  const [pending, startSubmitTransition] = useTransition();

  const selectedSupplier = useMemo(
    () => suppliers.find((supplier) => supplier.id === supplierId) ?? null,
    [supplierId, suppliers],
  );

  const resetForm = useCallback(() => {
    setSupplierId("");
    setBatchId("");
    setAmount("");
    setPaymentMethod("transfer");
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setNotes("");
    setBatches([]);
    setBankAccounts([]);
    setBankAccountId("");
    setSummary(null);
    setError(null);
  }, []);

  const loadBatchSummary = useCallback((nextBatchId: string) => {
    startSummaryTransition(async () => {
      try {
        const nextSummary = await getBatchPaymentSummary(nextBatchId);
        setSummary(nextSummary);
        setAmount(nextSummary ? nextSummary.outstanding.toFixed(2) : "");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not load batch summary.",
        );
      }
    });
  }, []);

  const loadSupplierBatches = useCallback(
    (nextSupplierId: string, preferredBatchId = "") => {
      setSupplierId(nextSupplierId);
      setBatchId("");
      setAmount("");
      setSummary(null);
      setBatches([]);
      setBankAccounts([]);
      setBankAccountId("");
      setError(null);

      if (!nextSupplierId) {
        return;
      }

      startBatchTransition(async () => {
        try {
          const [nextBatches, nextBankAccounts] = await Promise.all([
            getOutstandingBatchesForSupplier(nextSupplierId),
            getSupplierBankAccountsForPayment(nextSupplierId),
          ]);
          setBatches(nextBatches);
          setBankAccounts(nextBankAccounts);
          setBankAccountId(pickDefaultBankAccountId(nextBankAccounts));

          const nextBatchId =
            preferredBatchId &&
            nextBatches.some((row) => row.id === preferredBatchId)
              ? preferredBatchId
              : (nextBatches[0]?.id ?? "");

          if (nextBatchId) {
            setBatchId(nextBatchId);
            loadBatchSummary(nextBatchId);
          }
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load supplier batches.",
          );
        }
      });
    },
    [loadBatchSummary],
  );

  const openRecordPayment = useCallback(
    (prefill?: RecordPrefill) => {
      resetForm();
      setOpen(true);

      if (prefill?.supplierId) {
        loadSupplierBatches(prefill.supplierId, prefill.batchId ?? "");
      }
    },
    [loadSupplierBatches, resetForm],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("supplier_id", supplierId);
    formData.set("batch_id", batchId);
    formData.set("amount", amount);
    formData.set("payment_method", paymentMethod);
    formData.set("payment_date", paymentDate);
    formData.set("notes", notes);
    if (paymentMethod === "transfer") {
      formData.set("bank_account_id", bankAccountId);
    }

    startSubmitTransition(async () => {
      const result = await recordPayment(formData);
      if (result.error) {
        setError(result.error);
        return;
      }

      setOpen(false);
      resetForm();
      router.push(
        result.autoApproved
          ? "/payments?view=history&status=approved&message=recorded_auto"
          : "/payments?view=history&status=pending_approval&message=recorded",
      );
      router.refresh();
    });
  }

  return (
    <PaymentsRecordContext.Provider value={{ openRecordPayment }}>
      {children}

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record supplier payment</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="supplier_id">Supplier</Label>
                <select
                  id="supplier_id"
                  value={supplierId}
                  onChange={(event) => loadSupplierBatches(event.target.value)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  required
                >
                  <option value="">Select supplier with outstanding balance</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.supplier_name} ({supplier.supplier_code}) —{" "}
                      {formatNaira(supplier.outstanding_total)} outstanding
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch_id">Procurement batch</Label>
                <select
                  id="batch_id"
                  value={batchId}
                  onChange={(event) => {
                    const nextBatchId = event.target.value;
                    setBatchId(nextBatchId);
                    setAmount("");
                    setSummary(null);
                    if (nextBatchId) {
                      loadBatchSummary(nextBatchId);
                    }
                  }}
                  disabled={!supplierId || loadingBatches}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                  required
                >
                  <option value="">
                    {loadingBatches ? "Loading batches…" : "Select batch"}
                  </option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {formatProcurementBatchNumber(batch.batch_number)} —{" "}
                      {batch.product_type} — {formatNaira(batch.outstanding)}{" "}
                      outstanding
                    </option>
                  ))}
                </select>
              </div>

              {summary ? (
                <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div>
                      <p className="text-muted-foreground">Batch value</p>
                      <p className="font-medium">
                        {formatNaira(summary.batch_value)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Paid so far</p>
                      <p className="font-medium">
                        {formatNaira(summary.paid_total)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Outstanding</p>
                      <p className="font-medium text-primary">
                        {loadingSummary
                          ? "Loading…"
                          : formatNaira(summary.outstanding)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Payment amount</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_date">Payment date</Label>
                  <Input
                    id="payment_date"
                    name="payment_date"
                    type="date"
                    value={paymentDate}
                    onChange={(event) => setPaymentDate(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment method</Label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(method);
                        if (method === "cash") {
                          setBankAccountId("");
                        } else {
                          setBankAccountId(pickDefaultBankAccountId(bankAccounts));
                        }
                      }}
                      className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                        paymentMethod === method
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <PaymentMethodBadge method={method} />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected: {PAYMENT_METHOD_LABELS[paymentMethod]}
                </p>
              </div>

              {paymentMethod === "transfer" ? (
                <div className="space-y-2">
                  <Label htmlFor="bank_account_id">Payout bank account</Label>
                  {bankAccounts.length === 0 ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
                      This supplier has no bank accounts yet.{" "}
                      {supplierId ? (
                        <a
                          href={`/suppliers/${supplierId}`}
                          className="font-medium underline underline-offset-2"
                        >
                          Add one on the supplier profile
                        </a>
                      ) : (
                        "Select a supplier first."
                      )}{" "}
                      before recording a transfer payment.
                    </div>
                  ) : (
                    <select
                      id="bank_account_id"
                      value={bankAccountId}
                      onChange={(event) => setBankAccountId(event.target.value)}
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      required
                    >
                      {bankAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {formatBankAccountLabel(account)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  className="flex min-h-20 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>

              {selectedSupplier && !autoApproveOnSave ? (
                <p className="text-sm text-muted-foreground">
                  Payment will be saved as <strong>pending approval</strong>. An
                  admin must approve before it reduces the batch outstanding
                  balance.
                </p>
              ) : null}
              {selectedSupplier && autoApproveOnSave ? (
                <p className="text-sm text-muted-foreground">
                  As admin, this payment will be{" "}
                  <strong>approved immediately</strong> and the batch balance
                  will update straight away.
                </p>
              ) : null}

              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={pending || !supplierId || !batchId || (paymentMethod === "transfer" && !bankAccountId)}>
                  {pending ? "Saving…" : "Save payment"}
                </Button>
              </div>
            </form>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </PaymentsRecordContext.Provider>
  );
}

export function RecordPaymentHeaderButton() {
  const { openRecordPayment } = usePaymentsRecord();

  return (
    <Button type="button" size="lg" onClick={() => openRecordPayment()}>
      <Plus />
      Record payment
    </Button>
  );
}
