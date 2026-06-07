import { notFound } from "next/navigation";

import { NotificationBanner } from "@/components/layout/notification-banner";
import { PaymentStatusBadge } from "@/components/procurement/payment-status-badge";
import { ProcurementBatchSummaryCard } from "@/components/procurement/procurement-batch-summary-card";
import { ProcurementForm } from "@/components/procurement/procurement-form";
import { ProcurementUnitPriceForm } from "@/components/procurement/procurement-unit-price-form";
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
  updateProcurementUnitPrice,
} from "@/lib/actions/procurement";
import { ProcurementActionButton } from "@/components/procurement/procurement-action-button";
import { SupplyInvoicePreviewDialog } from "@/components/procurement/supply-invoice-preview-dialog";
import { requireProcurementRead } from "@/lib/auth/require-role";
import { canApproveProcurementStep } from "@/lib/permissions/matrix";
import { procurementStepFromStatus } from "@/lib/permissions/approval";
import {
  canEditPendingProcurement,
  canEditProcurementPricing,
  canSetProcurementFinalPrice,
  canViewProcurementPricing,
  canViewSupplyInvoice,
} from "@/lib/procurement/permissions";
import { formatProcurementBatchNumber } from "@/lib/procurement/batch-number";
import {
  type PaymentStatus,
  type ProcurementStatus,
  type ProcurementType,
} from "@/lib/procurement/constants";

type ProcurementDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProcurementDetailPage({
  params,
}: ProcurementDetailPageProps) {
  const { role } = await requireProcurementRead();
  const showPricing = canViewProcurementPricing(role);
  const isSuperAdmin = role === "super_admin";
  const { id } = await params;
  const batch = await getProcurementById(id);

  if (!batch) {
    notFound();
  }

  const batchStatus = batch.status as ProcurementStatus;
  const approvalStep = procurementStepFromStatus(batchStatus);
  const canApprove =
    approvalStep != null && canApproveProcurementStep(role, approvalStep);
  const isPending = approvalStep != null;
  const isApproved = batchStatus === "approved";
  const showInvoice = isApproved && canViewSupplyInvoice(role);

  const [suppliers, employees] =
    isPending && canEditPendingProcurement(role, batchStatus)
      ? await Promise.all([
          getActiveSuppliersForSelect(),
          getActiveEmployeesForSelect(),
        ])
      : [[], []];

  const boundUpdate = updateProcurement.bind(null, id);
  const boundUnitPrice = updateProcurementUnitPrice.bind(null, id);
  const boundApprove = approveProcurementAction.bind(null, id);
  const boundUnlock = unlockProcurementAction.bind(null, id);

  const supplierName = batch.supplier_name;
  const supplierCode = batch.supplier_code;
  const needsPriceBeforeApprove =
    canApprove &&
    approvalStep === "final" &&
    (!batch.unit_price || Number(batch.unit_price) <= 0);
  const hasPrice =
    batch.unit_price != null && Number(batch.unit_price) > 0;

  const canEditPending = canEditPendingProcurement(role, batchStatus);
  const showEditForm = isPending && canEditPending;
  const showAdminFinalApproval =
    isPending &&
    canSetProcurementFinalPrice(role, batchStatus) &&
    !showEditForm;

  const approveLabel =
    approvalStep === "first" || approvalStep === "second"
      ? "Confirm warehouse receipt"
      : "Final approve";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {formatProcurementBatchNumber(batch.batch_number)}
            </h1>
            <ProcurementStatusBadge
              status={batchStatus}
              viewerRole={role}
            />
            <PaymentStatusBadge status={batch.payment_status as PaymentStatus} />
          </div>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <ProductTypeBadge productType={batch.product_type} />
            {supplierName ? <span>{supplierName}</span> : null}
            {supplierCode ? <span>({supplierCode})</span> : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showInvoice ? (
            <SupplyInvoicePreviewDialog batchId={id} label="View invoice" />
          ) : null}
          {canApprove ? (
            <ProcurementActionButton
              label={approveLabel}
              action={boundApprove}
              redirectTo="/procurement?message=approved"
              disabled={needsPriceBeforeApprove}
              disabledReason={
                needsPriceBeforeApprove
                  ? "Enter unit price below, then final approve."
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Approval trail</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Recorded by</dt>
              <dd className="text-sm font-medium">
                {batch.created_by_name ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Confirmed by</dt>
              <dd className="text-sm font-medium">
                {batch.first_approved_by_name ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Final approval</dt>
              <dd className="text-sm font-medium">
                {batch.approved_by_name ?? "—"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {showAdminFinalApproval ? (
        <>
          {needsPriceBeforeApprove ? (
            <NotificationBanner urgency="urgent">
              Warehouse receipt is confirmed. Review the batch summary below,
              then enter the unit price before final approval.
            </NotificationBanner>
          ) : (
            <NotificationBanner urgency="awareness">
              Unit price is set. Review the summary and final approve when
              ready.
            </NotificationBanner>
          )}

          <ProcurementBatchSummaryCard batch={batch} showPricing={hasPrice} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Unit price</CardTitle>
            </CardHeader>
            <CardContent>
              <ProcurementUnitPriceForm
                action={boundUnitPrice}
                batchId={id}
                totalKg={Number(batch.total_kg)}
                initialUnitPrice={batch.unit_price}
                redirectTo={`/procurement/${id}?message=price_saved`}
              />
            </CardContent>
          </Card>
        </>
      ) : isApproved ? (
        <ProcurementBatchSummaryCard
          batch={batch}
          showPricing={showPricing}
          title="Batch summary"
        />
      ) : showEditForm ? (
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
      ) : (
        <ProcurementBatchSummaryCard batch={batch} title="Batch details" />
      )}
    </div>
  );
}
