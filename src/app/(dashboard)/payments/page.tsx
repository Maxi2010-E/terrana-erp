import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { NotificationBanner } from "@/components/layout/notification-banner";
import { SuccessFlash } from "@/components/layout/success-flash";
import { PaymentDashboardCards } from "@/components/payments/payment-dashboard-cards";
import { PaymentHistoryTable } from "@/components/payments/payment-history-table";
import { PaymentQueueTable } from "@/components/payments/payment-queue-table";
import { PaymentViewTabs } from "@/components/payments/payment-view-tabs";
import {
  PaymentsRecordProvider,
  RecordPaymentHeaderButton,
} from "@/components/payments/payments-record-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  getPaymentDashboardCounts,
  getPaymentNotifications,
  getPaymentQueue,
  getPaymentsHistory,
  getSuppliersWithOutstandingBatches,
} from "@/lib/actions/payments";
import { requirePaymentRead } from "@/lib/auth/require-role";
import {
  PAYMENT_QUEUE_FILTERS,
  type PaymentQueueFilter,
  type PaymentRecordStatus,
} from "@/lib/payments/constants";
import {
  formatPaymentOutstandingBanner,
  formatPaymentSubmittedPendingUrgentBanner,
  formatPaymentUrgentBanner,
} from "@/lib/payments/notifications";
import {
  canApprovePayment,
  canRecordPayment,
  canViewPaymentAmounts,
} from "@/lib/payments/permissions";

type PaymentsPageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    message?: string;
    view?: string;
    filter?: string;
    status?: string;
  }>;
};

function successMessage(message: string | undefined): string | null {
  if (message === "recorded") {
    return "Payment recorded and sent for admin approval.";
  }
  if (message === "recorded_auto") {
    return "Payment recorded and approved. Batch balance updated.";
  }
  if (message === "approved") {
    return "Payment approved and batch balance updated.";
  }
  if (message === "unlocked") {
    return "Payment unlocked for review.";
  }
  return null;
}

function parseQueueFilter(value: string | undefined): PaymentQueueFilter {
  if (value && PAYMENT_QUEUE_FILTERS.includes(value as PaymentQueueFilter)) {
    return value as PaymentQueueFilter;
  }

  return "outstanding";
}

function parseHistoryStatus(
  value: string | undefined,
): PaymentRecordStatus | "all" {
  if (value === "pending_approval" || value === "approved") {
    return value;
  }

  return "all";
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const { role } = await requirePaymentRead();
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const query = params.q ?? "";
  const view = params.view === "history" ? "history" : "queue";
  const queueFilter = parseQueueFilter(params.filter);
  const historyStatus = parseHistoryStatus(params.status);
  const flash = successMessage(params.message);
  const canRecord = canRecordPayment(role);
  const canApprove = canApprovePayment(role);
  const showAmounts = canViewPaymentAmounts(role);

  const [counts, suppliersWithOutstanding, paymentNotifications] =
    await Promise.all([
      getPaymentDashboardCounts(),
      canRecord ? getSuppliersWithOutstandingBatches() : Promise.resolve([]),
      getPaymentNotifications(),
    ]);

  const queueResult =
    view === "queue"
      ? await getPaymentQueue(page, queueFilter, query)
      : null;
  const historyResult =
    view === "history"
      ? await getPaymentsHistory(page, query, historyStatus)
      : null;
  const listTotal =
    view === "history"
      ? (historyResult?.total ?? 0)
      : (queueResult?.total ?? 0);

  const urgentBanner = formatPaymentUrgentBanner(paymentNotifications);
  const outstandingBanner = formatPaymentOutstandingBanner(paymentNotifications);
  const submittedPendingUrgentBanner = formatPaymentSubmittedPendingUrgentBanner(
    paymentNotifications.submittedPending,
  );

  const pendingApprovalCount = canApprove
    ? counts.pendingApproval
    : paymentNotifications.submittedPending;

  const onPendingTab =
    view === "history" && historyStatus === "pending_approval";

  const topUrgentBanner = canApprove
    ? urgentBanner
    : submittedPendingUrgentBanner;

  const historySectionTitle =
    historyStatus === "pending_approval"
      ? "Pending approval"
      : historyStatus === "approved"
        ? "Approved payments"
        : "All payment records";

  const historyEmptyMessage =
    historyStatus === "pending_approval"
      ? canApprove
        ? "No payments awaiting approval."
        : "You have no payments waiting for admin approval."
      : historyStatus === "approved"
        ? "No approved payment records yet."
        : "No payment records yet.";

  return (
    <PaymentsRecordProvider
      suppliers={suppliersWithOutstanding}
      autoApproveOnSave={canApprove}
    >
      <div className="space-y-6">
        <PageHeader
          title="Payments"
          description="Record supplier payments against approved procurement batches."
          meta={
            view === "history"
              ? historyStatus === "pending_approval"
                ? `${listTotal.toLocaleString()} pending payment(s)`
                : `${listTotal.toLocaleString()} payment record(s)`
              : `${listTotal.toLocaleString()} batches in queue`
          }
          actions={canRecord ? <RecordPaymentHeaderButton /> : null}
        />

      {flash ? <SuccessFlash message={flash} /> : null}

      {topUrgentBanner && !onPendingTab ? (
        <NotificationBanner urgency="urgent">
          {topUrgentBanner}{" "}
          <Link
            href="/payments?view=history&status=pending_approval"
            className="font-medium underline underline-offset-2"
          >
            Review pending payments
          </Link>
        </NotificationBanner>
      ) : null}

      {outstandingBanner ? (
        <NotificationBanner urgency="awareness">
          {outstandingBanner}
        </NotificationBanner>
      ) : null}

      <PaymentDashboardCards
        counts={counts}
        activeQueue={queueFilter}
        pendingCount={pendingApprovalCount}
        showQueueCards={view === "queue"}
        hidePendingAlert={onPendingTab}
      />

      <PaymentViewTabs
        view={view}
        historyStatus={historyStatus}
        queueFilter={queueFilter}
        pendingApprovalCount={pendingApprovalCount}
      />

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="gap-4 border-b border-border/60 pb-4">
          <CardTitle className="text-base">
            {view === "history" ? historySectionTitle : "Payment queue"}
          </CardTitle>

          {view === "queue" ? (
            <p className="text-sm text-muted-foreground">
              Use the summary cards above to switch between outstanding,
              partially paid, and completed batches.
            </p>
          ) : null}

          {view === "history" && historyStatus === "pending_approval" ? (
            <p className="text-sm text-muted-foreground">
              {canApprove
                ? "Payments recorded by accounts that need admin approval before batch balances update."
                : "Payments you recorded that are waiting for admin approval."}
            </p>
          ) : null}

          {view === "history" && historyStatus === "all" ? (
            <p className="text-sm text-muted-foreground">
              Includes pending and approved payment records. Use Pending approval
              for items that still need action.
            </p>
          ) : null}

          <form className="flex max-w-md gap-2" method="get">
            <input type="hidden" name="view" value={view} />
            {view === "queue" ? (
              <input type="hidden" name="filter" value={queueFilter} />
            ) : historyStatus !== "all" ? (
              <input type="hidden" name="status" value={historyStatus} />
            ) : null}
            <input
              name="q"
              defaultValue={query}
              placeholder={
                view === "history"
                  ? "Search by reference or notes…"
                  : "Search by batch number or product…"
              }
              className="flex h-10 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
        </CardHeader>
        <CardContent className="space-y-5 px-4 pb-6 pt-5">
          {view === "history" ? (
            <PaymentHistoryTable
              rows={historyResult?.rows ?? []}
              canApprove={canApprove}
              showAmounts={showAmounts}
              emptyMessage={historyEmptyMessage}
            />
          ) : (
            <PaymentQueueTable
              rows={queueResult?.rows ?? []}
              canRecord={canRecord}
              showAmounts={showAmounts}
            />
          )}

          <PaginationBar
            page={page}
            total={listTotal}
            pathname="/payments"
            query={{
              q: query || undefined,
              view,
              filter: view === "queue" ? queueFilter : undefined,
              status:
                view === "history" && historyStatus !== "all"
                  ? historyStatus
                  : undefined,
            }}
          />
        </CardContent>
      </Card>
      </div>
    </PaymentsRecordProvider>
  );
}
