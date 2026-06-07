import Link from "next/link";

import { PaymentActionButton } from "@/components/payments/payment-action-button";
import { PaymentReceiptPreviewDialog } from "@/components/payments/payment-receipt-preview-dialog";
import { PaymentMethodBadge } from "@/components/payments/payment-method-badge";
import { PaymentRecordStatusBadge } from "@/components/payments/payment-record-status-badge";
import { formatMoneyIfAllowed } from "@/lib/currency";
import { formatBankAccountLabel } from "@/lib/payments/bank-account";
import { formatPaymentReference } from "@/lib/payments/reference";
import type { PaymentHistoryRow } from "@/lib/payments/types";
import { formatProcurementBatchNumber } from "@/lib/procurement/batch-number";

type PaymentHistoryTableProps = {
  rows: PaymentHistoryRow[];
  canApprove?: boolean;
  showAmounts?: boolean;
  emptyMessage?: string;
};

export function PaymentHistoryTable({
  rows,
  canApprove = false,
  showAmounts = true,
  emptyMessage = "No payment records yet.",
}: PaymentHistoryTableProps) {
  const showActions = canApprove && rows.some((row) => row.status === "pending_approval");

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1120px] text-left text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="pb-3 pr-4 font-medium">Reference</th>
            <th className="pb-3 pr-4 font-medium">Supplier</th>
            <th className="pb-3 pr-4 font-medium">Batch</th>
            <th className="pb-3 pr-4 font-medium">Amount</th>
            <th className="pb-3 pr-4 font-medium">Date</th>
            <th className="pb-3 pr-4 font-medium">Method</th>
            <th className="pb-3 pr-4 font-medium">Payout account</th>
            <th className="pb-3 pr-4 font-medium">Status</th>
            <th className="pb-3 pr-4 font-medium">Approved by</th>
            <th className="pb-3 pr-4 font-medium">Receipt</th>
            {showActions ? (
              <th className="pb-3 font-medium">Actions</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={showActions ? 11 : 10}
                className="py-8 text-center text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="py-3 pr-4 font-medium">
                  <Link
                    href={`/payments/${row.id}`}
                    className="hover:text-primary hover:underline"
                  >
                    {formatPaymentReference(row.payment_reference)}
                  </Link>
                </td>
                <td className="py-3 pr-4">
                  <div>{row.supplier_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {row.supplier_code}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <Link
                    href={`/procurement/${row.batch_id}`}
                    className="hover:text-primary hover:underline"
                  >
                    {formatProcurementBatchNumber(row.batch_number)}
                  </Link>
                </td>
                <td className="py-3 pr-4 font-medium">
                  {formatMoneyIfAllowed(row.amount, showAmounts)}
                </td>
                <td className="py-3 pr-4">{row.payment_date}</td>
                <td className="py-3 pr-4">
                  <PaymentMethodBadge method={row.payment_method} />
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {row.payment_method === "transfer"
                    ? row.bank_account
                      ? formatBankAccountLabel(row.bank_account)
                      : "—"
                    : "—"}
                </td>
                <td className="py-3 pr-4">
                  <PaymentRecordStatusBadge status={row.status} />
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {row.approved_by_name ?? "—"}
                </td>
                <td className="py-3 pr-4">
                  {row.status === "approved" ? (
                    <PaymentReceiptPreviewDialog paymentId={row.id} />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                {showActions ? (
                  <td className="py-3">
                    {canApprove && row.status === "pending_approval" ? (
                      <PaymentActionButton
                        paymentId={row.id}
                        action="approve"
                        label="Approve"
                        size="sm"
                        redirectTo={`/payments/${row.id}?message=approved`}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
