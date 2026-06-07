import Link from "next/link";
import { notFound } from "next/navigation";

import { NotificationBanner } from "@/components/layout/notification-banner";
import { PaymentReceiptPreviewDialog } from "@/components/payments/payment-receipt-preview-dialog";
import { PaymentApprovePanel } from "@/components/payments/payment-approve-panel";
import { PaymentMethodBadge } from "@/components/payments/payment-method-badge";
import { PaymentActionButton } from "@/components/payments/payment-action-button";
import { PaymentRecordStatusBadge } from "@/components/payments/payment-record-status-badge";
import { ProductTypeBadge } from "@/components/procurement/product-type-badge";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getPaymentById,
  getSupplierBankAccountsForPayment,
} from "@/lib/actions/payments";
import { requirePaymentRead } from "@/lib/auth/require-role";
import { formatMoneyIfAllowed } from "@/lib/currency";
import { formatBankAccountLabel } from "@/lib/payments/bank-account";
import { formatPaymentReference } from "@/lib/payments/reference";
import {
  canApprovePayment,
  canUnlockPayment,
  canViewPaymentAmounts,
} from "@/lib/payments/permissions";
import { formatProcurementBatchNumber } from "@/lib/procurement/batch-number";

type PaymentDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
};

function successMessage(message: string | undefined): string | null {
  if (message === "approved") {
    return "Payment approved successfully.";
  }
  if (message === "unlocked") {
    return "Payment unlocked for review.";
  }
  return null;
}

export default async function PaymentDetailPage({
  params,
  searchParams,
}: PaymentDetailPageProps) {
  const { role } = await requirePaymentRead();
  const showAmounts = canViewPaymentAmounts(role);
  const { id } = await params;
  const query = await searchParams;
  const payment = await getPaymentById(id);

  if (!payment) {
    notFound();
  }

  const bankAccounts =
    payment.payment_method === "transfer"
      ? await getSupplierBankAccountsForPayment(payment.supplier_id)
      : [];

  const canApprove = canApprovePayment(role);
  const canUnlock = canUnlockPayment(role);
  const isPending = payment.status === "pending_approval";
  const isApproved = payment.status === "approved";
  const flash = successMessage(query.message);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {formatPaymentReference(payment.payment_reference)}
            </h1>
            <PaymentRecordStatusBadge status={payment.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {payment.supplier_name} ({payment.supplier_code})
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isApproved ? (
            <PaymentReceiptPreviewDialog paymentId={id} label="View receipt" />
          ) : null}
          {canUnlock && isApproved ? (
            <PaymentActionButton
              paymentId={id}
              action="unlock"
              label="Unlock payment"
              variant="outline"
              redirectTo={`/payments/${id}?message=unlocked`}
            />
          ) : null}
          <LinkButton
            variant="outline"
            href={
              isPending
                ? "/payments?view=history&status=pending_approval"
                : "/payments?view=history"
            }
          >
            Back to payments
          </LinkButton>
        </div>
      </div>

      {flash ? (
        <p
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200"
          role="status"
        >
          {flash}
        </p>
      ) : null}

      {canApprove && isPending ? (
        <NotificationBanner urgency="urgent">
          Confirm the payout bank account, then approve. Supplier and batch balances
          will not update until you approve.
        </NotificationBanner>
      ) : null}

      {!canApprove && isPending ? (
        <NotificationBanner urgency="awareness">
          This payment is waiting for admin approval. Batch balances will update
          once an admin approves it.
        </NotificationBanner>
      ) : null}

      {canApprove && isPending ? (
        <PaymentApprovePanel
          paymentId={id}
          paymentMethod={payment.payment_method}
          supplierId={payment.supplier_id}
          bankAccounts={bankAccounts}
          initialBankAccountId={payment.bank_account_id}
          redirectTo={`/payments/${id}?message=approved`}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="font-medium">
              {formatMoneyIfAllowed(payment.amount, showAmounts)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Payment date</p>
            <p className="font-medium">{payment.payment_date}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Method</p>
            <div className="mt-1">
              <PaymentMethodBadge method={payment.payment_method} />
            </div>
          </div>
          {payment.payment_method === "transfer" ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-sm text-muted-foreground">Payout bank account</p>
              <p className="font-medium">
                {payment.bank_account
                  ? formatBankAccountLabel(payment.bank_account)
                  : "Not selected yet"}
              </p>
            </div>
          ) : null}
          <div>
            <p className="text-sm text-muted-foreground">Recorded by</p>
            <p className="font-medium">{payment.recorded_by_name ?? "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Approved by</p>
            <p className="font-medium">{payment.approved_by_name ?? "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Approved at</p>
            <p className="font-medium">
              {payment.approved_at
                ? new Date(payment.approved_at).toLocaleString()
                : "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Linked procurement batch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/procurement/${payment.batch_id}`}
              className="font-medium hover:text-primary hover:underline"
            >
              {formatProcurementBatchNumber(payment.batch_number)}
            </Link>
            <ProductTypeBadge productType={payment.product_type} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Batch value</p>
              <p className="font-medium">
                {formatMoneyIfAllowed(payment.batch_value, showAmounts)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Supplier</p>
              <p className="font-medium">
                <Link
                  href={`/suppliers/${payment.supplier_id}`}
                  className="hover:text-primary hover:underline"
                >
                  {payment.supplier_name}
                </Link>
              </p>
            </div>
          </div>
          {payment.notes ? (
            <div>
              <p className="text-muted-foreground">Notes</p>
              <p>{payment.notes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
