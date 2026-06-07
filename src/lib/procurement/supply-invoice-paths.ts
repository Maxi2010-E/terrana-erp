export function supplyInvoiceStreamPath(batchId: string): string {
  return `/api/procurement/batches/${batchId}/invoice`;
}
