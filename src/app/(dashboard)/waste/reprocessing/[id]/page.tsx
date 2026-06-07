import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { WasteReprocessingSessionForm } from "@/components/waste/waste-reprocessing-session-form";
import { WasteReprocessingSessionRequestSummary } from "@/components/waste/waste-reprocessing-session-request-summary";
import { ProcessingStatusBadge } from "@/components/processing/processing-status-badge";
import { ProcurementActionButton } from "@/components/procurement/procurement-action-button";
import { WasteTypeBadge } from "@/components/waste/waste-type-badge";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  approveWasteReprocessingSessionAction,
  getWasteReprocessingSessionById,
  rejectWasteReprocessingSessionAction,
} from "@/lib/actions/waste-reprocessing";
import { getActiveEmployeesForSelect } from "@/lib/actions/procurement";
import { requireProcessingRead } from "@/lib/auth/require-role";
import { notificationCardClassName } from "@/lib/notifications/urgency";
import { canApproveProcessingSession } from "@/lib/processing/permissions";
import type { ProcessingSessionStatus } from "@/lib/processing/constants";
import { cn } from "@/lib/utils";

type WasteReprocessingDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
};

function flashMessage(message: string | undefined): string | null {
  if (message === "submitted") {
    return "Re-processing request submitted. Waiting for admin approval before work can begin.";
  }
  if (message === "approved") {
    return "Re-processing session approved. You can now record output and secondary waste.";
  }
  if (message === "rejected") {
    return "Re-processing request rejected. The kg reserved on this waste line have been released.";
  }
  return null;
}

export default async function WasteReprocessingDetailPage({
  params,
  searchParams,
}: WasteReprocessingDetailPageProps) {
  const { role } = await requireProcessingRead();
  const { id } = await params;
  const query = await searchParams;
  const flash = flashMessage(query.message);

  const session = await getWasteReprocessingSessionById(id);
  if (!session) {
    notFound();
  }

  const employees = await getActiveEmployeesForSelect();
  const canApprove = canApproveProcessingSession(role);
  const isPending = session.status === "pending_approval";
  const isRejected = session.status === "rejected";
  const isWorkable = session.status === "in_progress";

  const boundApprove = approveWasteReprocessingSessionAction.bind(null, id);
  const boundReject = rejectWasteReprocessingSessionAction.bind(null, id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={session.session_number}
        meta={`${session.origin_session_number} · ${session.local_product_label}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {canApprove && isPending ? (
              <>
                <ProcurementActionButton
                  label="Approve re-processing"
                  action={boundApprove}
                  redirectTo={`/waste/reprocessing/${id}?message=approved`}
                />
                <ProcurementActionButton
                  label="Reject"
                  variant="outline"
                  action={boundReject}
                  redirectTo={`/waste/reprocessing/${id}?message=rejected`}
                />
              </>
            ) : null}
            <LinkButton variant="outline" href="/waste?view=processing">
              Back to re-processing
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
        <WasteTypeBadge wasteType={session.waste_type} />
        <span className="text-sm text-muted-foreground">
          {session.local_product_label}
        </span>
        {session.completed_at ? (
          <span className="text-sm text-muted-foreground">
            Completed {new Date(session.completed_at).toLocaleDateString()}
            {session.yield_pct != null ? ` · Yield ${session.yield_pct}%` : ""}
            {session.local_stock_number
              ? ` · Stock ${session.local_stock_number}`
              : ""}
          </span>
        ) : null}
        {session.approved_at ? (
          <span className="text-sm text-muted-foreground">
            Approved by {session.approved_by_name ?? "—"}
            {" · "}
            {new Date(session.approved_at).toLocaleString()}
          </span>
        ) : null}
        {session.rejected_at ? (
          <span className="text-sm text-muted-foreground">
            Rejected by {session.rejected_by_name ?? "—"}
            {" · "}
            {new Date(session.rejected_at).toLocaleString()}
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
              The team has requested to send {session.kg_sent.toLocaleString()}{" "}
              kg of {session.local_product_label.toLowerCase()} input for
              re-processing.
              {canApprove
                ? " Approve or reject so the floor can continue."
                : " An admin must approve before output and secondary waste can be recorded."}
            </p>
          </CardHeader>
          <CardContent className="px-4 pb-6 pt-5">
            <WasteReprocessingSessionRequestSummary session={session} />
          </CardContent>
        </Card>
      ) : null}

      {isRejected ? (
        <Card className="rounded-2xl border-rose-200 shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base">Request rejected</CardTitle>
            <p className="text-sm text-muted-foreground">
              This re-processing request was not approved. The kg are no longer
              reserved by this session.
            </p>
          </CardHeader>
          <CardContent className="px-4 pb-6 pt-5">
            <WasteReprocessingSessionRequestSummary session={session} />
          </CardContent>
        </Card>
      ) : null}

      {isWorkable || session.status === "completed" ? (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base">
              {session.status === "completed"
                ? "Session summary"
                : "Record output & secondary waste"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-6 pt-5">
            <WasteReprocessingSessionForm
              session={session}
              employees={employees}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
