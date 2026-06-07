import { DashboardRecentActivityPanels } from "@/components/dashboard/dashboard-recent-activity";
import { LinkButton } from "@/components/ui/link-button";
import type { DashboardRecentActivity } from "@/lib/dashboard/types";

type ReportsActivitySectionProps = {
  activity: DashboardRecentActivity;
};

export function ReportsActivitySection({ activity }: ReportsActivitySectionProps) {
  const isEmpty =
    activity.procurements.length === 0 &&
    activity.payments.length === 0 &&
    activity.shipments.length === 0 &&
    activity.expenses.length === 0;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Latest activity</h2>
          <p className="text-sm text-muted-foreground">
            Most recent procurements, payments, shipments, and expenses — click a row to open the record.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/procurement" variant="outline" size="sm">
            Procurement
          </LinkButton>
          <LinkButton href="/payments" variant="outline" size="sm">
            Payments
          </LinkButton>
          <LinkButton href="/logistics?tab=shipments" variant="outline" size="sm">
            Shipments
          </LinkButton>
          <LinkButton href="/expenses?tab=daily" variant="outline" size="sm">
            Expenses
          </LinkButton>
        </div>
      </div>

      {isEmpty ? (
        <p className="rounded-xl border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
          No recent records yet. Activity will appear here as your team uses procurement, payments,
          logistics, and expenses.
        </p>
      ) : (
        <DashboardRecentActivityPanels activity={activity} />
      )}
    </section>
  );
}
