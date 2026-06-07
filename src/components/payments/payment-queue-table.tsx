"use client";

import Link from "next/link";

import { usePaymentsRecord } from "@/components/payments/payments-record-provider";
import { PaymentStatusBadge } from "@/components/procurement/payment-status-badge";
import { ProductTypeBadge } from "@/components/procurement/product-type-badge";
import { Button } from "@/components/ui/button";
import { formatMoneyIfAllowed } from "@/lib/currency";
import { formatProcurementBatchNumber } from "@/lib/procurement/batch-number";
import type { PaymentQueueRow } from "@/lib/payments/types";

type PaymentQueueTableProps = {
  rows: PaymentQueueRow[];
  canRecord: boolean;
  showAmounts?: boolean;
};

export function PaymentQueueTable({
  rows,
  canRecord,
  showAmounts = true,
}: PaymentQueueTableProps) {
  const { openRecordPayment } = usePaymentsRecord();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="pb-3 pr-4 font-medium">Batch</th>
            <th className="pb-3 pr-4 font-medium">Supplier</th>
            <th className="pb-3 pr-4 font-medium">Product</th>
            <th className="pb-3 pr-4 font-medium">Batch value</th>
            <th className="pb-3 pr-4 font-medium">Paid</th>
            <th className="pb-3 pr-4 font-medium">Outstanding</th>
            <th className="pb-3 pr-4 font-medium">Status</th>
            <th className="pb-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="py-8 text-center text-muted-foreground"
              >
                No batches in this queue.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.batch_id} className="border-b last:border-0">
                <td className="py-3 pr-4 font-medium">
                  <Link
                    href={`/procurement/${row.batch_id}`}
                    className="hover:text-primary hover:underline"
                  >
                    {formatProcurementBatchNumber(row.batch_number)}
                  </Link>
                </td>
                <td className="py-3 pr-4">
                  <div>{row.supplier_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {row.supplier_code}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <ProductTypeBadge productType={row.product_type} />
                </td>
                <td className="py-3 pr-4">
                  {formatMoneyIfAllowed(row.batch_value, showAmounts)}
                </td>
                <td className="py-3 pr-4">
                  {formatMoneyIfAllowed(row.paid_total, showAmounts)}
                </td>
                <td className="py-3 pr-4 font-medium">
                  {formatMoneyIfAllowed(row.outstanding, showAmounts)}
                </td>
                <td className="py-3 pr-4">
                  <PaymentStatusBadge status={row.payment_status} />
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-2">
                    {canRecord ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          openRecordPayment({
                            supplierId: row.supplier_id,
                            batchId: row.batch_id,
                          })
                        }
                      >
                        Pay batch
                      </Button>
                    ) : null}
                    <Link
                      href={`/procurement/${row.batch_id}`}
                      className="inline-flex h-7 items-center rounded-lg border border-border bg-background px-2.5 text-xs font-medium hover:bg-muted"
                    >
                      View batch
                    </Link>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
