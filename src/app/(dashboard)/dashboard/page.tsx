import Link from "next/link";

import { DashboardKpiGrid } from "@/components/dashboard/dashboard-kpi-grid";
import { DashboardRecentActivityPanels } from "@/components/dashboard/dashboard-recent-activity";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboardOverview } from "@/lib/actions/dashboard";
import { getSessionUser } from "@/lib/auth/get-session";
import { canAccessReports } from "@/lib/dashboard/permissions";
import { normalizeAppRole, type AppRole } from "@/lib/roles";

const QUICK_LINKS: Partial<
  Record<AppRole, { href: string; label: string; description: string }[]>
> = {
  super_admin: [
    { href: "/procurement", label: "Procurement", description: "Batch intake and approval" },
    { href: "/payments", label: "Payments", description: "Supplier payment queue" },
    { href: "/reports", label: "Reports", description: "Trends and recent activity" },
  ],
  admin: [
    { href: "/procurement", label: "Procurement", description: "Batch intake and approval" },
    { href: "/payments", label: "Payments", description: "Supplier payment queue" },
    { href: "/reports", label: "Reports", description: "Trends and recent activity" },
  ],
  warehouse_manager: [
    { href: "/procurement", label: "Procurement", description: "Record batches for review" },
    { href: "/processing", label: "Processing", description: "Processing sessions" },
    { href: "/inventory?tab=pre_stock", label: "Pre-stock", description: "Goods awaiting grading" },
  ],
  cash_manager: [
    { href: "/procurement", label: "Procurement", description: "Confirm warehouse receipts" },
    { href: "/expenses", label: "Expenses", description: "Petty cash and operational spend" },
    { href: "/payments", label: "Payments", description: "Payment queue (no amounts)" },
  ],
  logistics_manager: [
    { href: "/logistics?tab=shipments", label: "Shipments", description: "Export shipments" },
    { href: "/processing", label: "Processing", description: "Review processing requests" },
    { href: "/procurement", label: "Procurement", description: "View procurement batches" },
  ],
};

export default async function DashboardPage() {
  const { appUser } = await getSessionUser();
  const role = normalizeAppRole(appUser?.role);
  const overview = await getDashboardOverview();
  const quickLinks = QUICK_LINKS[role] ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Company-wide KPIs and shortcuts to your modules.
        </p>
      </div>

      <DashboardKpiGrid kpis={overview.kpis} />

      {quickLinks.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick links</CardTitle>
            <CardDescription>Jump to your most-used modules.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-xl border border-border/60 px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <p className="font-medium">{link.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {link.description}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {canAccessReports(role) ? (
        <DashboardRecentActivityPanels activity={overview.recentActivity} />
      ) : null}
    </div>
  );
}
