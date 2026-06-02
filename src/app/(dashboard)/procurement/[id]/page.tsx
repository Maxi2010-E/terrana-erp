import { notFound } from "next/navigation";

import { PaymentStatusBadge } from "@/components/procurement/payment-status-badge";
import { ProcurementForm } from "@/components/procurement/procurement-form";
import { ProductTypeBadge } from "@/components/procurement/product-type-badge";
import { ProcurementStatusBadge } from "@/components/procurement/procurement-status-badge";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  approveProcurementAction,
  getActiveEmployeesForSelect,
  getActiveSuppliersForSelect,
  getProcurementById,
  unlockProcurementAction,
  updateProcurement,
} from "@/lib/actions/procurement";
import { ProcurementActionButton } from "@/components/procurement/procurement-action-button";
import { requireProcurementRead } from "@/lib/auth/require-role";
import {
  canEditProcurementPricing,
  canViewProcurementPricing,
} from "@/lib/procurement/permissions";
import { formatNairaOrDash } from "@/lib/currency";
import { formatProcurementBatchNumber } from "@/lib/procurement/batch-number";
import {
  PROCUREMENT_TYPE_LABELS,
  QUALITY_DECISION_LABELS,
  type PaymentStatus,
  type ProcurementStatus,
  type ProcurementType,
  type QualityDecision,
} from "@/lib/procurement/constants";

type ProcurementDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProcurementDetailPage({
  params,
}: ProcurementDetailPageProps) {
  const { role } = await requireProcurementRead();
  const showPricing = canViewProcurementPricing(role);
  const canApprove = role === "super_admin" || role === "admin";
  const isSuperAdmin = role === "super_admin";
  const { id } = await params;
  const batch = await getProcurementById(id);

  if (!batch) {
    notFound();
  }

  const isPending = batch.status === "pending_approval";
  const isApproved = batch.status === "approved";

  const [suppliers, employees] = isPending
    ? await Promise.all([
        getActiveSuppliersForSelect(),
        getActiveEmployeesForSelect(),
      ])
    : [[], []];

  const boundUpdate = updateProcurement.bind(null, id);
  const boundApprove = approveProcurementAction.bind(null, id);
  const boundUnlock = unlockProcurementAction.bind(null, id);

  const supplierName = batch.supplier_name;
  const supplierCode = batch.supplier_code;
  const needsPriceBeforeApprove =
    canApprove &&
    isPending &&
    (!batch.unit_price || Number(batch.unit_price) <= 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {formatProcurementBatchNumber(batch.batch_number)}
            </h1>
            <ProcurementStatusBadge status={batch.status as ProcurementStatus} />
            <PaymentStatusBadge status={batch.payment_status as PaymentStatus} />
          </div>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <ProductTypeBadge productType={batch.product_type} />
            {supplierName ? <span>{supplierName}</span> : null}
            {supplierCode ? <span>({supplierCode})</span> : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canApprove && isPending ? (
            <ProcurementActionButton
              label="Approve batch"
              action={boundApprove}
              redirectTo="/procurement?message=approved"
              disabled={needsPriceBeforeApprove}
              disabledReason={
                needsPriceBeforeApprove
                  ? "Enter unit price below and save changes before approving."
                  : undefined
              }
            />
          ) : null}
          {isSuperAdmin && isApproved ? (
            <ProcurementActionButton
              label="Unlock for editing"
              variant="outline"
              action={boundUnlock}
              redirectTo={`/procurement/${id}?message=unlocked`}
            />
          ) : null}
          <LinkButton variant="outline" href="/procurement">
            Back to list
          </LinkButton>
        </div>
      </div>

      {isApproved ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Batch summary</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">Type</dt>
                <dd className="text-sm font-medium">
                  {PROCUREMENT_TYPE_LABELS[batch.procurement_type as ProcurementType]}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Total KG</dt>
                <dd className="text-sm font-medium">
                  {Number(batch.total_kg).toLocaleString()} kg
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Bags</dt>
                <dd className="text-sm font-medium">{batch.number_of_bags}</dd>
              </div>
              {showPricing ? (
                <>
                  <div>
                    <dt className="text-xs text-muted-foreground">Unit price</dt>
                    <dd className="text-sm font-medium tabular-nums">
                      {formatNairaOrDash(batch.unit_price)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Total value</dt>
                    <dd className="text-sm font-medium tabular-nums">
                      {formatNairaOrDash(batch.total_value)}
                    </dd>
                  </div>
                </>
              ) : null}
              <div>
                <dt className="text-xs text-muted-foreground">Procurement date</dt>
                <dd className="text-sm font-medium">{batch.procurement_date}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Quality decision</dt>
                <dd className="text-sm font-medium">
                  {
                    QUALITY_DECISION_LABELS[
                      batch.quality_decision as QualityDecision
                    ]
                  }
                </dd>
              </div>
              {batch.notes ? (
                <div className="sm:col-span-2 lg:col-span-3">
                  <dt className="text-xs text-muted-foreground">Notes</dt>
                  <dd className="text-sm">{batch.notes}</dd>
                </div>
              ) : null}
            </dl>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Edit batch</CardTitle>
          </CardHeader>
          <CardContent>
            <ProcurementForm
              action={boundUpdate}
              suppliers={suppliers}
              employees={employees}
              canEditPricing={canEditProcurementPricing(role)}
              submitLabel="Save changes"
              redirectTo={`/procurement/${id}?message=updated`}
              initial={{
                procurement_type: batch.procurement_type as ProcurementType,
                product_condition: batch.product_condition,
                product_age: batch.product_age,
                product_color: batch.product_color,
                mixed_type: batch.mixed_type,
                supplier_id: batch.supplier_id,
                number_of_bags: batch.number_of_bags,
                kg_per_bag: batch.kg_per_bag,
                extra_kg: batch.extra_kg,
                total_kg: batch.total_kg,
                unit_price: batch.unit_price,
                procurement_date: batch.procurement_date,
                received_by: batch.received_by,
                quality_decision: batch.quality_decision,
                notes: batch.notes,
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
