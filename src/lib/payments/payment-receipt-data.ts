import { formatBankAccountLabel } from "@/lib/payments/bank-account";
import { calcOutstanding, calcPaidTotal } from "@/lib/payments/balance";
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/lib/payments/constants";
import type { PaymentReceiptData } from "@/lib/payments/payment-receipt-types";
import { formatPaymentReference } from "@/lib/payments/reference";
import { formatProcurementBatchNumber } from "@/lib/procurement/batch-number";
import {
  formatApprovedAtLabel,
  formatGeneratedAtLabel,
} from "@/lib/documents/generated-at";
import {
  nameFromMap,
  resolveUserDisplayNames,
} from "@/lib/users/resolve-user-names";
import { createClient } from "@/lib/supabase/server";

export async function loadPaymentReceiptData(
  paymentId: string,
): Promise<PaymentReceiptData | null> {
  const supabase = await createClient();

  const { data: payment, error } = await supabase
    .from("supplier_payments")
    .select(
      `
      id,
      batch_id,
      payment_reference,
      amount,
      payment_method,
      payment_date,
      status,
      notes,
      recorded_by,
      approved_by,
      approved_at,
      supplier_bank_accounts (
        bank_name,
        account_number,
        account_name,
        is_primary
      ),
      suppliers (
        supplier_name,
        supplier_code,
        address,
        phone
      ),
      procurement_batches (
        batch_number,
        product_type,
        total_value
      )
    `,
    )
    .eq("id", paymentId)
    .maybeSingle();

  if (error || !payment || payment.status !== "approved") {
    return null;
  }

  const supplierJoin = payment.suppliers as
    | {
        supplier_name: string;
        supplier_code: string;
        address: string | null;
        phone: string | null;
      }
    | Array<{
        supplier_name: string;
        supplier_code: string;
        address: string | null;
        phone: string | null;
      }>
    | null;
  const supplier = Array.isArray(supplierJoin) ? supplierJoin[0] : supplierJoin;

  const batchJoin = payment.procurement_batches as
    | { batch_number: string; product_type: string; total_value: number }
    | Array<{ batch_number: string; product_type: string; total_value: number }>
    | null;
  const batch = Array.isArray(batchJoin) ? batchJoin[0] : batchJoin;

  if (!supplier || !batch) {
    return null;
  }

  const bankJoin = payment.supplier_bank_accounts as
    | {
        bank_name: string;
        account_number: string;
        account_name: string;
        is_primary: boolean;
      }
    | Array<{
        bank_name: string;
        account_number: string;
        account_name: string;
        is_primary: boolean;
      }>
    | null;
  const bankAccount = Array.isArray(bankJoin) ? bankJoin[0] : bankJoin;

  const { data: batchPayments, error: paymentsError } = await supabase
    .from("supplier_payments")
    .select("amount, status")
    .eq("batch_id", payment.batch_id);

  if (paymentsError) {
    throw new Error(paymentsError.message);
  }

  const paidTotal = calcPaidTotal(batchPayments ?? []);
  const batchValue = Number(batch.total_value);
  const nameByUserId = await resolveUserDisplayNames([
    payment.recorded_by,
    payment.approved_by,
  ]);

  const paymentReference = formatPaymentReference(payment.payment_reference);
  const batchNumberDisplay = formatProcurementBatchNumber(batch.batch_number);

  return {
    companyName: "Terrana Africa Limited",
    reference: paymentReference,
    paymentReference,
    paymentDate: payment.payment_date,
    statusLabel: "APPROVED",
    amount: Number(payment.amount),
    paymentMethodLabel:
      PAYMENT_METHOD_LABELS[payment.payment_method as PaymentMethod],
    payoutAccountLabel:
      payment.payment_method === "transfer" && bankAccount
        ? formatBankAccountLabel(bankAccount)
        : null,
    supplierName: supplier.supplier_name,
    supplierCode: supplier.supplier_code,
    supplierAddress: supplier.address,
    supplierPhone: supplier.phone,
    batchNumber: batch.batch_number,
    batchNumberDisplay,
    productType: batch.product_type,
    batchValue,
    paidTotal,
    outstanding: calcOutstanding(batchValue, paidTotal),
    recordedByName: nameFromMap(nameByUserId, payment.recorded_by),
    approvedByName: nameFromMap(nameByUserId, payment.approved_by),
    approvedAtLabel: formatApprovedAtLabel(payment.approved_at),
    notes: payment.notes,
    generatedAtLabel: formatGeneratedAtLabel(),
  };
}

export function paymentReceiptFilename(data: PaymentReceiptData): string {
  const ref = data.paymentReference.replace(/[^a-zA-Z0-9-]+/g, "-");
  return `payment-receipt-${ref}.pdf`;
}
