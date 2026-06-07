import type { PaymentStatus } from "@/lib/procurement/constants";

export function calcPaidTotal(
  payments: Array<{ amount: number; status: string }>,
): number {
  return payments
    .filter((payment) => payment.status === "approved")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
}

export function calcOutstanding(batchValue: number, paidTotal: number): number {
  return Math.max(0, Number(batchValue) - paidTotal);
}

export function deriveBatchPaymentStatus(
  batchValue: number,
  paidTotal: number,
): PaymentStatus {
  if (paidTotal <= 0) {
    return "unpaid";
  }

  if (paidTotal >= batchValue) {
    return "paid";
  }

  return "partially_paid";
}
