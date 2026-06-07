export function paymentReceiptStreamPath(paymentId: string): string {
  return `/api/payments/${paymentId}/receipt`;
}
