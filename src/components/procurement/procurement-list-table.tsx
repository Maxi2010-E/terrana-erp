import { ProcurementLoadDetailCell } from "@/components/procurement/procurement-load-detail-cell";
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
  type ProductCondition,
} from "@/lib/procurement/constants";
import type { ProcurementListRow } from "@/lib/procurement/types";

type ProcurementListTableProps = {
  rows: ProcurementListRow[];
  showPricing: boolean;
  showLoadDetails?: boolean;
};

const HEAD_CELL =
  "px-4 pb-3 pt-1 text-left text-xs font-medium tracking-wide uppercase";
const BODY_CELL = "px-4 py-4 align-middle leading-normal";

export function ProcurementListTable({
  rows,
  showPricing,
  showLoadDetails = false,
}: ProcurementListTableProps) {
  const columnCount =
    (showPricing ? 10 : 9) + (showLoadDetails ? 1 : 0);

  return (
    <div className="overflow-x-auto">
      <table
        className={`w-full border-collapse text-left text-sm ${
          showLoadDetails ? "min-w-[1240px]" : "min-w-[1040px]"
        }`}
      >
        <thead>
          <tr className="border-b border-border/60 text-muted-foreground">
            <th className={`${HEAD_CELL} w-[7.5rem] whitespace-nowrap`}>Batch</th>
            <th className={`${HEAD_CELL} min-w-[5.5rem]`}>Type</th>
            <th className={`${HEAD_CELL} min-w-[9rem]`}>Product</th>
            <th className={`${HEAD_CELL} min-w-[8rem]`}>Supplier</th>
            <th className={`${HEAD_CELL} min-w-[4.5rem]`}>KG</th>
            {showLoadDetails ? (
              <th className={`${HEAD_CELL} min-w-[9.5rem]`}>
                {showPricing ? "Load & price" : "Bags / load"}
              </th>
            ) : null}
            {showPricing ? (
              <th className={`${HEAD_CELL} min-w-[5.5rem]`}>Value</th>
            ) : null}
            <th className={`${HEAD_CELL} min-w-[8.5rem]`}>Status</th>
            <th className={`${HEAD_CELL} min-w-[7.5rem]`}>Payment</th>
            <th className={`${HEAD_CELL} min-w-[6.5rem]`}>Date</th>
            <th className={`${HEAD_CELL} w-28`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columnCount}
                className="px-4 py-12 text-center text-muted-foreground"
              >
                No procurement batches found.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border/50 last:border-0"
              >
                <td
                  className={`${BODY_CELL} whitespace-nowrap font-medium tabular-nums`}
                >
                  {formatProcurementBatchNumber(row.batch_number)}
                </td>
                <td className={BODY_CELL}>
                  {
                    PROCUREMENT_TYPE_LABELS[
                      row.procurement_type as ProcurementType
                    ]
                  }
                </td>
                <td className={BODY_CELL}>
                  <ProductTypeBadge productType={row.product_type} />
                </td>
                <td className={BODY_CELL}>{row.supplier_name}</td>
                <td className={`${BODY_CELL} tabular-nums`}>
                  {Number(row.total_kg).toLocaleString()}
                </td>
                {showLoadDetails ? (
                  <td className={BODY_CELL}>
                    <ProcurementLoadDetailCell
                      row={{
                        procurement_type: row.procurement_type,
                        product_condition:
                          row.product_condition as ProductCondition,
                        number_of_bags: row.number_of_bags,
                        kg_per_bag: row.kg_per_bag,
                        extra_kg: row.extra_kg,
                      }}
                      showUnitPrice={showPricing}
                      unitPrice={row.unit_price}
                    />
                  </td>
                ) : null}
                {showPricing ? (
                  <td className={`${BODY_CELL} tabular-nums`}>
                    {formatNairaOrDash(row.total_value)}
                  </td>
                ) : null}
                <td className={BODY_CELL}>
                  <ProcurementStatusBadge
                    status={row.status as ProcurementStatus}
                  />
                </td>
                <td className={BODY_CELL}>
                  <PaymentStatusBadge
                    status={row.payment_status as PaymentStatus}
                  />
                </td>
                <td
                  className={`${BODY_CELL} whitespace-nowrap tabular-nums text-muted-foreground`}
                >
                  {row.procurement_date}
                </td>
                <td className={BODY_CELL}>
                  <TableViewAction href={`/procurement/${row.id}`} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
