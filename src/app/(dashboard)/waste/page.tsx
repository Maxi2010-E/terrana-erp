import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { NotificationBanner } from "@/components/layout/notification-banner";
import { SuccessFlash } from "@/components/layout/success-flash";
import { WasteDashboardCards } from "@/components/waste/waste-dashboard-cards";
import { WasteLocalStockTable } from "@/components/waste/waste-local-stock-table";
import { WasteRecordsTable } from "@/components/waste/waste-records-table";
import { WasteReprocessingPendingSessionsTable } from "@/components/waste/waste-reprocessing-pending-sessions-table";
import { WasteReprocessingQueueTable } from "@/components/waste/waste-reprocessing-queue-table";
import { WasteReprocessingSessionsTable } from "@/components/waste/waste-reprocessing-sessions-table";
import { WasteViewTabs } from "@/components/waste/waste-view-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  getMyPendingWasteReprocessingSessions,
  getPendingWasteReprocessingSessions,
  getWasteLocalStockList,
  getWasteReprocessingQueue,
  getWasteReprocessingSessionsList,
} from "@/lib/actions/waste-reprocessing";
import {
  getWasteDashboardSummary,
  getWasteRecordsList,
} from "@/lib/actions/waste";
import { requireProcessingRead } from "@/lib/auth/require-role";
import { canReviewProcessingApprovals } from "@/lib/processing/permissions";
import {
  WASTE_TYPES,
  WASTE_TYPE_LABELS,
  type WasteType,
} from "@/lib/processing/constants";

type WastePageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    type?: string;
    view?: string;
    message?: string;
  }>;
};

function parseWasteType(value: string | undefined): WasteType | undefined {
  if (!value) {
    return undefined;
  }

  return WASTE_TYPES.includes(value as WasteType)
    ? (value as WasteType)
    : undefined;
}

function parseView(value: string | undefined): "records" | "processing" {
  return value === "processing" ? "processing" : "records";
}

function successMessage(message: string | undefined): string | null {
  if (message === "submitted") {
    return "Re-processing request submitted for admin approval.";
  }
  if (message === "approved") {
    return "Re-processing session approved.";
  }
  if (message === "rejected") {
    return "Re-processing request rejected.";
  }
  if (message === "completed") {
    return "Re-processing completed. Clean product added to local stock.";
  }
  if (message === "saved") {
    return "Re-processing session saved.";
  }
  return null;
}

export default async function WastePage({ searchParams }: WastePageProps) {
  const { role } = await requireProcessingRead();
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const query = params.q ?? "";
  const wasteType = parseWasteType(params.type);
  const view = parseView(params.view);
  const flash = successMessage(params.message);
  const canApprove = canReviewProcessingApprovals(role);

  if (view === "processing") {
    const [queue, { rows, total }, localStock, pendingRows, myPendingRows] =
      await Promise.all([
        getWasteReprocessingQueue(),
        getWasteReprocessingSessionsList(page, query),
        getWasteLocalStockList(),
        canApprove
          ? getPendingWasteReprocessingSessions()
          : Promise.resolve([]),
        canApprove
          ? Promise.resolve([])
          : getMyPendingWasteReprocessingSessions(),
      ]);

    const pendingCount = canApprove
      ? pendingRows.length
      : myPendingRows.length;

    return (
      <div className="space-y-6">
        <PageHeader
          title="Waste management"
          meta={`${queue.length.toLocaleString()} line(s) in re-processing queue · ${total.toLocaleString()} session(s)`}
        />

        <WasteViewTabs view={view} pendingApprovalCount={pendingCount} />

        {flash ? <SuccessFlash message={flash} /> : null}

        {canApprove && pendingRows.length > 0 ? (
          <NotificationBanner urgency="urgent">
            {pendingRows.length} re-processing request
            {pendingRows.length === 1 ? "" : "s"} awaiting approval.{" "}
            <Link
              href="#pending-approval"
              className="font-medium underline underline-offset-2"
            >
              Review pending requests
            </Link>
          </NotificationBanner>
        ) : null}

        {!canApprove && myPendingRows.length > 0 ? (
          <NotificationBanner urgency="urgent">
            {myPendingRows.length} of your re-processing request
            {myPendingRows.length === 1 ? "" : "s"} awaiting admin approval.{" "}
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
                Review waste re-processing requests before work begins.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 px-4 pb-6 pt-5">
              <WasteReprocessingPendingSessionsTable rows={pendingRows} />
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
              <WasteReprocessingPendingSessionsTable rows={myPendingRows} />
            </CardContent>
          </Card>
        ) : null}

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base">Re-processing queue</CardTitle>
            <p className="text-sm text-muted-foreground">
              Collected waste and secondary byproducts available to clean for
              local sale. Secondary waste from a completed session re-enters this
              queue automatically.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-6 pt-5">
            <WasteReprocessingQueueTable rows={queue} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base">Local stock</CardTitle>
            <p className="text-sm text-muted-foreground">
              Clean product from completed re-processing sessions, ready for
              local market sale.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-6 pt-5">
            <WasteLocalStockTable rows={localStock} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="gap-4 border-b border-border/60 pb-4">
            <CardTitle className="text-base">Re-processing history</CardTitle>
            <form className="flex max-w-md gap-2" method="get">
              <input type="hidden" name="view" value="processing" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Search by session number…"
                className="flex h-10 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <Button type="submit" variant="outline">
                Search
              </Button>
            </form>
          </CardHeader>
          <CardContent className="space-y-5 px-4 pb-6 pt-5">
            <WasteReprocessingSessionsTable rows={rows} />
            <PaginationBar
              page={page}
              total={total}
              pathname="/waste"
              query={{
                view: "processing",
                q: query || undefined,
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const [summary, { rows, total }, pendingRows, myPendingRows] =
    await Promise.all([
      getWasteDashboardSummary(),
      getWasteRecordsList(page, query, wasteType),
      canApprove
        ? getPendingWasteReprocessingSessions()
        : Promise.resolve([]),
      canApprove
        ? Promise.resolve([])
        : getMyPendingWasteReprocessingSessions(),
    ]);

  const pendingCount = canApprove
    ? pendingRows.length
    : myPendingRows.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Waste management"
        meta="Waste collected from processing — traceability slips and category totals."
      />

      <WasteViewTabs view={view} pendingApprovalCount={pendingCount} />

      <WasteDashboardCards summary={summary} activeType={wasteType} />

      {wasteType ? (
        <p className="text-sm text-muted-foreground">
          Filtered by{" "}
          <span className="font-medium text-foreground">
            {WASTE_TYPE_LABELS[wasteType]}
          </span>
          .{" "}
          <Link href="/waste" className="text-primary hover:underline">
            Clear filter
          </Link>
        </p>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Waste records</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              One row per category recorded on a processing session. Available
              kg is what remains for re-processing.
            </p>
          </div>
          <form action="/waste" method="get" className="flex w-full max-w-sm gap-2">
            <input type="hidden" name="view" value="records" />
            {wasteType ? (
              <input type="hidden" name="type" value={wasteType} />
            ) : null}
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search session…"
              className="h-10 flex-1 rounded-xl border border-input bg-background px-3 text-sm"
            />
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-xl border px-4 text-sm font-medium hover:bg-muted/50"
            >
              Search
            </button>
          </form>
        </CardHeader>
        <CardContent>
          <WasteRecordsTable rows={rows} />
          <PaginationBar
            page={page}
            total={total}
            pathname="/waste"
            query={{
              view: "records",
              q: query || undefined,
              type: wasteType,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
