import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardRecentActivity } from "@/lib/dashboard/types";

type DashboardRecentActivityPanelsProps = {
  activity: DashboardRecentActivity;
  compact?: boolean;
};

const HEAD_CELL =
  "px-4 pb-3 pt-1 text-left text-xs font-medium tracking-wide uppercase";
const BODY_CELL = "px-4 py-3 align-middle text-sm leading-normal";

export function DashboardRecentActivityPanels({
  activity,
  compact = false,
}: DashboardRecentActivityPanelsProps) {
  const limit = compact ? 3 : undefined;

  const procurements = limit
    ? activity.procurements.slice(0, limit)
    : activity.procurements;
  const payments = limit ? activity.payments.slice(0, limit) : activity.payments;
  const shipments = limit ? activity.shipments.slice(0, limit) : activity.shipments;
  const expenses = limit ? activity.expenses.slice(0, limit) : activity.expenses;

  if (
    procurements.length === 0 &&
    payments.length === 0 &&
    shipments.length === 0 &&
    expenses.length === 0
  ) {
    return null;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {procurements.length > 0 ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Latest procurements</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground">
                    <th className={HEAD_CELL}>Batch</th>
                    <th className={HEAD_CELL}>Supplier</th>
                    <th className={HEAD_CELL}>KG</th>
                    <th className={HEAD_CELL}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {procurements.map((row) => (
                    <tr key={row.id} className="border-b border-border/50 last:border-0">
                      <td className={BODY_CELL}>
                        <Link
                          href={`/procurement/${row.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {row.batchNumber}
                        </Link>
                      </td>
                      <td className={BODY_CELL}>{row.supplierName}</td>
                      <td className={`${BODY_CELL} tabular-nums`}>
                        {row.totalKg.toLocaleString()}
                      </td>
                      <td className={`${BODY_CELL} tabular-nums`}>{row.procurementDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {payments.length > 0 ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Latest payments</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground">
                    <th className={HEAD_CELL}>Reference</th>
                    <th className={HEAD_CELL}>Amount</th>
                    <th className={HEAD_CELL}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((row) => (
                    <tr key={row.id} className="border-b border-border/50 last:border-0">
                      <td className={BODY_CELL}>
                        <Link
                          href={`/payments/${row.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {row.paymentReference}
                        </Link>
                      </td>
                      <td className={`${BODY_CELL} tabular-nums`}>
                        ₦{row.amount.toLocaleString()}
                      </td>
                      <td className={`${BODY_CELL} tabular-nums`}>{row.paymentDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {shipments.length > 0 ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Latest shipments</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground">
                    <th className={HEAD_CELL}>Shipment</th>
                    <th className={HEAD_CELL}>Container</th>
                    <th className={HEAD_CELL}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((row) => (
                    <tr key={row.id} className="border-b border-border/50 last:border-0">
                      <td className={BODY_CELL}>
                        <Link
                          href={`/logistics/shipments/${row.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {row.shipmentNumber}
                        </Link>
                      </td>
                      <td className={BODY_CELL}>{row.containerNumber}</td>
                      <td className={BODY_CELL}>{row.status.replaceAll("_", " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {expenses.length > 0 ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Latest expenses</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground">
                    <th className={HEAD_CELL}>Type</th>
                    <th className={HEAD_CELL}>Description</th>
                    <th className={HEAD_CELL}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((row) => (
                    <tr key={`${row.kind}-${row.id}`} className="border-b border-border/50 last:border-0">
                      <td className={`${BODY_CELL} capitalize`}>{row.kind}</td>
                      <td className={BODY_CELL}>{row.label}</td>
                      <td className={`${BODY_CELL} tabular-nums`}>
                        ₦{row.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
