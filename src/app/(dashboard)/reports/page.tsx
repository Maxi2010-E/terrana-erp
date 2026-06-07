import { DashboardKpiGrid } from "@/components/dashboard/dashboard-kpi-grid";
import { PageHeader } from "@/components/layout/page-header";
import { ReportsActivitySection } from "@/components/reports/reports-activity-section";
import { ReportsTrendPanel } from "@/components/reports/reports-trend-panel";
import { getReportsPageData } from "@/lib/actions/dashboard";
import { requireReportsRead } from "@/lib/auth/require-role";

export default async function ReportsPage() {
  await requireReportsRead();
  const { kpis, trends, recentActivity } = await getReportsPageData();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        description="Executive view for management: current company snapshot, six-month trends, and the latest operational activity."
        meta="Updated from live ERP data · refreshes every 30 seconds"
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Company snapshot</h2>
          <p className="text-sm text-muted-foreground">
            Key numbers right now — procurement volume, inventory, payments, logistics, and monthly spend.
          </p>
        </div>
        <DashboardKpiGrid kpis={kpis} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Six-month trends</h2>
          <p className="text-sm text-muted-foreground">
            Month-by-month movement across the export supply chain. Use this to spot seasonality, growth, and spend patterns.
          </p>
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <ReportsTrendPanel
            title="Procurement volume"
            description="KG of approved procurement batches received each month."
            points={trends.procurement}
            valueLabel={(value) => `${value.toLocaleString()} kg`}
            accentClassName="bg-chart-1"
          />
          <ReportsTrendPanel
            title="Grading output"
            description="KG of export inventory graded each month (new stock entering the export pool)."
            points={trends.inventory}
            valueLabel={(value) => `${value.toLocaleString()} kg`}
            accentClassName="bg-chart-2"
          />
          <ReportsTrendPanel
            title="Operating spend"
            description="Approved daily and operational expenses recorded each month."
            points={trends.expenses}
            valueLabel={(value) =>
              `₦${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
            }
            accentClassName="bg-chart-3"
          />
          <ReportsTrendPanel
            title="Export shipments"
            description="Total KG loaded into export containers each month."
            points={trends.shipments}
            valueLabel={(value) => `${value.toLocaleString()} kg`}
            accentClassName="bg-chart-4"
          />
        </div>
      </section>

      <ReportsActivitySection activity={recentActivity} />
    </div>
  );
}
