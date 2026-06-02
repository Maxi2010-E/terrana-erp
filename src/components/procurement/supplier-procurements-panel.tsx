import { PaymentStatusBadge } from "@/components/procurement/payment-status-badge";
import { ProductTypeBadge } from "@/components/procurement/product-type-badge";
import { ProcurementStatusBadge } from "@/components/procurement/procurement-status-badge";
import { TableViewAction } from "@/components/ui/table-view-action";
import { formatNairaOrDash } from "@/lib/currency";
import { formatProcurementBatchNumber } from "@/lib/procurement/batch-number";
import {
  PROCUREMENT_TYPE_LABELS,
  type PaymentStatus,
  type ProcurementStatus,
  type ProcurementType,
} from "@/lib/procurement/constants";

type SupplierProcurementRow = {
  id: string;
  batch_number: string;
  procurement_type: ProcurementType;
  product_type: string;
  total_kg: number;
  status: ProcurementStatus;
  payment_status: PaymentStatus;
  procurement_date: string;
  unit_price: number | null;
  total_value: number | null;
};

type SupplierProcurementsPanelProps = {
  rows: SupplierProcurementRow[];
  showPricing: boolean;
};

export function SupplierProcurementsPanel({
  rows,
  showPricing,
}: SupplierProcurementsPanelProps) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        No procurement batches for this supplier yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm [&_tbody_td]:px-3.5 [&_tbody_td]:py-3.5 [&_tbody_td]:align-middle [&_thead_th]:px-3.5 [&_thead_th]:pb-2.5 [&_thead_th]:pt-1">
        <thead>
          <tr className="border-b border-border/60 text-muted-foreground">
            <th className="w-[8.5rem] font-medium">Batch</th>
            <th className="font-medium">Type</th>
            <th className="font-medium">Product</th>
            <th className="font-medium">KG</th>
            {showPricing ? (
              <>
                <th className="font-medium">Unit price</th>
                <th className="font-medium">Total value</th>
              </>
            ) : null}
            <th className="font-medium">Status</th>
            <th className="font-medium">Payment</th>
            <th className="font-medium">Date</th>
            <th className="w-28 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border/50 last:border-0"
            >
              <td className="whitespace-nowrap font-medium tabular-nums">
                {formatProcurementBatchNumber(row.batch_number)}
              </td>
              <td>{PROCUREMENT_TYPE_LABELS[row.procurement_type]}</td>
              <td>
                <ProductTypeBadge productType={row.product_type} />
              </td>
              <td>{Number(row.total_kg).toLocaleString()}</td>
              {showPricing ? (
                <>
                  <td className="tabular-nums">
                    {formatNairaOrDash(row.unit_price)}
                  </td>
                  <td className="tabular-nums">
                    {formatNairaOrDash(row.total_value)}
                  </td>
                </>
              ) : null}
              <td>
                <ProcurementStatusBadge status={row.status} />
              </td>
              <td>
                <PaymentStatusBadge status={row.payment_status} />
              </td>
              <td className="whitespace-nowrap">{row.procurement_date}</td>
              <td>
                <TableViewAction href={`/procurement/${row.id}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
