import { PageHeader } from "@/components/layout/page-header";
import { ProcessingPendingSessionsTable } from "@/components/processing/processing-pending-sessions-table";
import { ProcessingQueueTable } from "@/components/processing/processing-queue-table";
import { ProcessingSessionsTable } from "@/components/processing/processing-sessions-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  getMyPendingProcessingSessions,
  getPendingProcessingSessions,
  getProcessingQueue,
  getProcessingSessionsList,
} from "@/lib/actions/processing";
import { requireProcessingRead } from "@/lib/auth/require-role";
import { notificationCardClassName } from "@/lib/notifications/urgency";
import { formatProcessingSubmittedPendingBanner } from "@/lib/processing/notifications";
import { canApproveProcessingSession } from "@/lib/processing/permissions";
import { cn } from "@/lib/utils";

type ProcessingPageProps = {
  searchParams: Promise<{ page?: string; message?: string }>;
};

function successMessage(message: string | undefined): string | null {
  if (message === "submitted") {
    return "Processing request submitted for admin approval.";
  }
  if (message === "approved") {
    return "Processing session approved.";
  }
  if (message === "rejected") {
    return "Processing request rejected.";
  }
  if (message === "started") {
    return "Processing session started.";
  }
  if (message === "completed") {
    return "Processing completed and output sent to pre-stock.";
  }
  if (message === "saved") {
    return "Processing session saved.";
  }
  if (message === "unlocked") {
    return "Processing session unlocked for editing.";
  }
  return null;
}

export default async function ProcessingPage({
  searchParams,
}: ProcessingPageProps) {
  const { role } = await requireProcessingRead();
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const flash = successMessage(params.message);
  const canApprove = canApproveProcessingSession(role);

  const [queue, { rows, total }, pendingRows, myPendingRows] = await Promise.all([
    getProcessingQueue(),
    getProcessingSessionsList(page),
    canApprove ? getPendingProcessingSessions() : Promise.resolve([]),
    canApprove ? Promise.resolve([]) : getMyPendingProcessingSessions(),
  ]);

  const submittedPendingBanner = formatProcessingSubmittedPendingBanner(
    myPendingRows.length,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Processing"
        meta={`${queue.length.toLocaleString()} batch(es) in queue · ${total.toLocaleString()} session(s)`}
      />

      {flash ? (
        <p
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200"
          role="status"
        >
          {flash}
        </p>
      ) : null}

      {canApprove && pendingRows.length > 0 ? (
        <Card className={notificationCardClassName("urgent")}>
          <CardHeader className="border-b border-red-200/60 pb-4 dark:border-red-500/30">
            <CardTitle className="text-base text-red-950 dark:text-red-100">
              Awaiting your approval
            </CardTitle>
            <p className="text-sm text-red-900/80 dark:text-red-100/80">
              Review processing requests before work begins on the floor. Other
              departments are waiting on your decision.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-6 pt-5">
            <ProcessingPendingSessionsTable rows={pendingRows} />
          </CardContent>
        </Card>
      ) : null}

      {!canApprove && submittedPendingBanner ? (
        <Card className={notificationCardClassName("awareness")}>
          <CardHeader className="border-b border-amber-200/60 pb-4 dark:border-amber-500/30">
            <CardTitle className="text-base text-amber-950 dark:text-amber-100">
              Waiting for admin approval
            </CardTitle>
            <p className="text-sm text-amber-900/80 dark:text-amber-100/80">
              {submittedPendingBanner} You can continue other work, but these
              sessions cannot start until an admin approves them.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-6 pt-5">
            <ProcessingPendingSessionsTable rows={myPendingRows} />
          </CardContent>
        </Card>
      ) : null}

      <Card
        className={cn(
          "rounded-2xl shadow-sm",
          queue.length > 0 ? notificationCardClassName("awareness") : undefined,
        )}
      >
        <CardHeader
          className={cn(
            "border-b border-border/60 pb-4",
            queue.length > 0 && "border-amber-200/60 dark:border-amber-500/30",
          )}
        >
          <CardTitle className="text-base">Processing queue</CardTitle>
          <p className="text-sm text-muted-foreground">
            Approved batches routed to processing with bags still available.
            {queue.length > 0
              ? " Work can be scheduled when the floor is ready."
              : null}
          </p>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-6 pt-5">
          <ProcessingQueueTable rows={queue} />
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-base">Session history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 px-4 pb-6 pt-5">
          <ProcessingSessionsTable rows={rows} />
          <PaginationBar
            page={page}
            total={total}
            pathname="/processing"
          />
        </CardContent>
      </Card>
    </div>
  );
}
