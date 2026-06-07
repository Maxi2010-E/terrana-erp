import Link from "next/link";

import { PaymentHistoryTable } from "@/components/payments/payment-history-table";
import type { SupplierPaymentRow } from "@/lib/payments/types";

type SupplierPaymentsPanelProps = {
  rows: SupplierPaymentRow[];
  canApprove?: boolean;
};

export function SupplierPaymentsPanel({
  rows,
  canApprove = false,
}: SupplierPaymentsPanelProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        <p className="font-medium text-foreground">No payment records yet</p>
        <p className="mt-2">
          Payments recorded against this supplier&apos;s procurement batches will
          appear here.
        </p>
        <Link
          href="/payments"
          className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
        >
          Record a payment
        </Link>
      </div>
    );
  }

  return (
    <PaymentHistoryTable
      rows={rows}
      canApprove={canApprove}
      emptyMessage="No payment records for this supplier yet."
    />
  );
}
