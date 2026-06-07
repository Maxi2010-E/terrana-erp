import { ProcurementCreateDialog } from "@/components/procurement/procurement-create-dialog";
import { ProcurementListTable } from "@/components/procurement/procurement-list-table";
import { ProcurementLoadToggle } from "@/components/procurement/procurement-load-toggle";
import { PageHeader } from "@/components/layout/page-header";
import { NotificationBanner } from "@/components/layout/notification-banner";
import { SuccessFlash } from "@/components/layout/success-flash";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  getActiveEmployeesForSelect,
  getActiveSuppliersForSelect,
  getProcurementNotifications,
  getProcurementsList,
} from "@/lib/actions/procurement";
import { requireProcurementRead } from "@/lib/auth/require-role";
import {
  formatProcurementAwarenessBanner,
  formatProcurementSubmittedPendingBanner,
  formatProcurementUrgentBanner,
} from "@/lib/procurement/notifications";
import {
  canCreateProcurement,
  canEditProcurementPricing,
  canViewProcurementPricing,
} from "@/lib/procurement/permissions";

type ProcurementPageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    message?: string;
    create?: string;
    load?: string;
  }>;
};

function successMessage(message: string | undefined): string | null {
  if (message === "created") {
    return "Procurement batch created successfully.";
  }
  if (message === "updated") {
    return "Procurement batch updated successfully.";
  }
  if (message === "approved") {
    return "Procurement batch approved and locked.";
  }
  if (message === "unlocked") {
    return "Procurement batch unlocked for editing.";
  }
  return null;
}

function recordLabel(total: number): string {
  if (total === 0) {
    return "No records yet";
  }
  if (total === 1) {
    return "1 record";
  }
  return `${total.toLocaleString()} records`;
}

export default async function ProcurementPage({
  searchParams,
}: ProcurementPageProps) {
  const { role } = await requireProcurementRead();
  const showPricing = canViewProcurementPricing(role);
  const canCreate = canCreateProcurement(role);
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const query = params.q ?? "";
  const showLoadDetails = params.load === "1";
  const flash = successMessage(params.message);
  const procurementNotifications = await getProcurementNotifications();
  const [{ rows, total }, suppliers, employees] = await Promise.all([
    getProcurementsList(page, query),
    canCreate ? getActiveSuppliersForSelect() : Promise.resolve([]),
    canCreate ? getActiveEmployeesForSelect() : Promise.resolve([]),
  ]);

  const urgentBanner = formatProcurementUrgentBanner(
    procurementNotifications,
    role,
  );
  const awarenessBanner = formatProcurementAwarenessBanner(
    procurementNotifications,
    role,
  );
  const submittedPendingBanner = formatProcurementSubmittedPendingBanner(
    procurementNotifications.submittedPending,
    role,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Procurement"
        meta={recordLabel(total)}
        actions={
          canCreate ? (
            <ProcurementCreateDialog
              suppliers={suppliers}
              employees={employees}
              canEditPricing={canEditProcurementPricing(role)}
              defaultOpen={params.create === "1"}
            />
          ) : null
        }
      />

      {flash ? <SuccessFlash message={flash} /> : null}

      {urgentBanner ? (
        <NotificationBanner urgency="urgent">{urgentBanner}</NotificationBanner>
      ) : null}

      {awarenessBanner ? (
        <NotificationBanner urgency="awareness">
          {awarenessBanner}
        </NotificationBanner>
      ) : null}

      {submittedPendingBanner ? (
        <NotificationBanner urgency="awareness">
          {submittedPendingBanner}
        </NotificationBanner>
      ) : null}

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="gap-4 border-b border-border/60 pb-4">
          <form className="flex max-w-md gap-2" method="get">
            <input
              name="q"
              defaultValue={query}
              placeholder="Search by batch number or product…"
              className="flex h-10 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            {showLoadDetails ? (
              <input type="hidden" name="load" value="1" />
            ) : null}
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
        </CardHeader>
        <CardContent className="space-y-5 px-4 pb-6 pt-5">
          <div className="flex justify-end">
            <ProcurementLoadToggle
              enabled={showLoadDetails}
              query={query || undefined}
              page={page}
            />
          </div>

          <ProcurementListTable
            rows={rows}
            showPricing={showPricing}
            showLoadDetails={showLoadDetails}
            viewerRole={role}
          />

          <PaginationBar
            page={page}
            total={total}
            pathname="/procurement"
            query={{
              q: query || undefined,
              load: showLoadDetails ? "1" : undefined,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
