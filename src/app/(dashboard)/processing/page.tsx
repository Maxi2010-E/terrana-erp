import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { NotificationBanner } from "@/components/layout/notification-banner";
import { SuccessFlash } from "@/components/layout/success-flash";
import { ProcessingPendingSessionsTable } from "@/components/processing/processing-pending-sessions-table";
import { ProcessingQueueTable } from "@/components/processing/processing-queue-table";
import { ProcessingSessionsTable } from "@/components/processing/processing-sessions-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  getMyPendingProcessingSessions,
  getPendingProcessingSessions,
  getProcessingQueue,
  getProcessingSessionsList,
} from "@/lib/actions/processing";
import { requireProcessingRead } from "@/lib/auth/require-role";
import {
  formatProcessingSubmittedPendingBanner,
  formatProcessingUrgentBanner,
} from "@/lib/processing/notifications";
import { canReviewProcessingApprovals } from "@/lib/processing/permissions";

type ProcessingPageProps = {
  searchParams: Promise<{ page?: string; q?: string; message?: string }>;
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
  const query = params.q ?? "";
  const flash = successMessage(params.message);
  const canApprove = canReviewProcessingApprovals(role);

  const [queue, { rows, total }, pendingRows, myPendingRows] = await Promise.all([
    getProcessingQueue(),
    getProcessingSessionsList(page, query),
    canApprove ? getPendingProcessingSessions() : Promise.resolve([]),
    canApprove ? Promise.resolve([]) : getMyPendingProcessingSessions(),
  ]);

  const urgentBanner = formatProcessingUrgentBanner(pendingRows.length);
  const submittedPendingBanner = formatProcessingSubmittedPendingBanner(
    myPendingRows.length,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Processing"
        meta={`${queue.length.toLocaleString()} batch(es) in queue · ${total.toLocaleString()} session(s)`}
      />

      {flash ? <SuccessFlash message={flash} /> : null}

      {canApprove && urgentBanner ? (
        <NotificationBanner urgency="urgent">
          {urgentBanner}{" "}
          <Link
            href="#pending-approval"
            className="font-medium underline underline-offset-2"
          >
            Review pending requests
          </Link>
        </NotificationBanner>
      ) : null}

      {!canApprove && submittedPendingBanner ? (
        <NotificationBanner urgency="urgent">
          {submittedPendingBanner}{" "}
          <Link
            href="#pending-approval"
            className="font-medium underline underline-offset-2"
          >
            Review your pending requests
          </Link>
        </NotificationBanner>
      ) : null}

      {canApprove && pendingRows.length > 0 ? (
        <Card id="pending-approval" className="rounded-2xl shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base">Awaiting your approval</CardTitle>
            <p className="text-sm text-muted-foreground">
              Review processing requests before work begins on the floor.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-6 pt-5">
            <ProcessingPendingSessionsTable rows={pendingRows} />
          </CardContent>
        </Card>
      ) : null}

      {!canApprove && myPendingRows.length > 0 ? (
        <Card id="pending-approval" className="rounded-2xl shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base">Waiting for admin approval</CardTitle>
            <p className="text-sm text-muted-foreground">
              These sessions cannot start until an admin approves them.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-6 pt-5">
            <ProcessingPendingSessionsTable rows={myPendingRows} />
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
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
        <CardHeader className="gap-4 border-b border-border/60 pb-4">
          <CardTitle className="text-base">Session history</CardTitle>
          <form className="flex max-w-md gap-2" method="get">
            <input
              name="q"
              defaultValue={query}
              placeholder="Search by session or batch number…"
              className="flex h-10 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
        </CardHeader>
        <CardContent className="space-y-5 px-4 pb-6 pt-5">
          <ProcessingSessionsTable rows={rows} />
          <PaginationBar
            page={page}
            total={total}
            pathname="/processing"
            query={{ q: query || undefined }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
