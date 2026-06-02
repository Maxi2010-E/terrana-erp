import { notFound } from "next/navigation";

import { ProcessingSessionForm } from "@/components/processing/processing-session-form";
import { ProcessingSessionRequestSummary } from "@/components/processing/processing-session-request-summary";
import { ProcessingStatusBadge } from "@/components/processing/processing-status-badge";
import { ProductTypeBadge } from "@/components/procurement/product-type-badge";
import { ProcurementActionButton } from "@/components/procurement/procurement-action-button";
import { PageHeader } from "@/components/layout/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  approveProcessingSessionAction,
  getProcessingSessionById,
  rejectProcessingSessionAction,
  unlockProcessingSession,
} from "@/lib/actions/processing";
import { getActiveEmployeesForSelect } from "@/lib/actions/procurement";
import { requireProcessingRead } from "@/lib/auth/require-role";
import { notificationCardClassName } from "@/lib/notifications/urgency";
import {
  canApproveProcessingSession,
  canUnlockProcessingSession,
} from "@/lib/processing/permissions";
import type { ProcessingSessionStatus } from "@/lib/processing/constants";
import { cn } from "@/lib/utils";

type ProcessingDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
};

function flashMessage(message: string | undefined): string | null {
  if (message === "submitted") {
    return "Processing request submitted. Waiting for admin approval before work can begin.";
  }
  if (message === "approved") {
    return "Processing session approved. You can now record output and waste.";
  }
  if (message === "rejected") {
    return "Processing request rejected. Bags have been released back to the batch.";
  }
  return null;
}

export default async function ProcessingDetailPage({
  params,
  searchParams,
}: ProcessingDetailPageProps) {
  const { role } = await requireProcessingRead();
  const { id } = await params;
  const query = await searchParams;
  const flash = flashMessage(query.message);

  const session = await getProcessingSessionById(id);
  if (!session) {
    notFound();
  }

  const employees = await getActiveEmployeesForSelect();
  const canApprove = canApproveProcessingSession(role);
  const isPending = session.status === "pending_approval";
  const isRejected = session.status === "rejected";
  const isWorkable = session.status === "in_progress";

  const boundUnlock = unlockProcessingSession.bind(null, id);
  const boundApprove = approveProcessingSessionAction.bind(null, id);
  const boundReject = rejectProcessingSessionAction.bind(null, id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={session.session_number}
        meta={`Batch ${session.batch_number} · ${session.supplier_name}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {canApprove && isPending ? (
              <>
                <ProcurementActionButton
                  label="Approve processing"
                  action={boundApprove}
                  redirectTo={`/processing/${id}?message=approved`}
                />
                <ProcurementActionButton
                  label="Reject"
                  variant="outline"
                  action={boundReject}
                  redirectTo={`/processing/${id}?message=rejected`}
                />
              </>
            ) : null}
            <LinkButton variant="outline" href="/processing">
              Back to processing
            </LinkButton>
          </div>
        }
      />

      {flash ? (
        <p
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200"
          role="status"
        >
          {flash}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <ProcessingStatusBadge
          status={session.status as ProcessingSessionStatus}
        />
        <ProductTypeBadge productType={session.product_type} />
        {session.completed_at ? (
          <span className="text-sm text-muted-foreground">
            Completed {new Date(session.completed_at).toLocaleDateString()}
            {session.yield_pct != null ? ` · Yield ${session.yield_pct}%` : ""}
          </span>
        ) : null}
        {session.approved_at ? (
          <span className="text-sm text-muted-foreground">
            Approved {new Date(session.approved_at).toLocaleString()}
          </span>
        ) : null}
        {session.rejected_at ? (
          <span className="text-sm text-muted-foreground">
            Rejected {new Date(session.rejected_at).toLocaleString()}
          </span>
        ) : null}
      </div>

      {isPending ? (
        <Card
          className={notificationCardClassName(
            canApprove ? "urgent" : "awareness",
          )}
        >
          <CardHeader
            className={cn(
              "border-b pb-4",
              canApprove
                ? "border-red-200/60 dark:border-red-500/30"
                : "border-amber-200/60 dark:border-amber-500/30",
            )}
          >
            <CardTitle
              className={cn(
                "text-base",
                canApprove
                  ? "text-red-950 dark:text-red-100"
                  : "text-amber-950 dark:text-amber-100",
              )}
            >
              {canApprove ? "Awaiting your approval" : "Awaiting admin approval"}
            </CardTitle>
            <p
              className={cn(
                "text-sm",
                canApprove
                  ? "text-red-900/80 dark:text-red-100/80"
                  : "text-muted-foreground",
              )}
            >
              The processing department has requested to send{" "}
              {session.bags_sent.toLocaleString()} bag(s) for processing.
              {canApprove
                ? " Approve or reject so the floor can continue."
                : " An admin must approve before output and waste can be recorded."}
            </p>
          </CardHeader>
          <CardContent className="px-4 pb-6 pt-5">
            <ProcessingSessionRequestSummary session={session} />
          </CardContent>
        </Card>
      ) : null}

      {isRejected ? (
        <Card className="rounded-2xl border-rose-200 shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base">Request rejected</CardTitle>
            <p className="text-sm text-muted-foreground">
              This processing request was not approved. The bags are no longer
              reserved by this session.
            </p>
          </CardHeader>
          <CardContent className="px-4 pb-6 pt-5">
            <ProcessingSessionRequestSummary session={session} />
          </CardContent>
        </Card>
      ) : null}

      {isWorkable || session.status === "completed" ? (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base">
              {session.status === "completed"
                ? "Session summary"
                : "Record output & waste"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-6 pt-5">
            <ProcessingSessionForm
              session={session}
              employees={employees}
              unlockAction={
                canUnlockProcessingSession(role) ? boundUnlock : undefined
              }
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
