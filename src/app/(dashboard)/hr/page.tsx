import { Suspense, type ReactNode } from "react";
import Link from "next/link";

import { HrHubView } from "@/components/hr/hr-hub-view";
import { HrHubActions } from "@/components/hr/hr-hub-actions";
import { AdvancesPanel } from "@/components/hr/panels/advances-panel";
import { BonusesPanel } from "@/components/hr/panels/bonuses-panel";
import { EmployeesPanel } from "@/components/hr/panels/employees-panel";
import { LeavePanel } from "@/components/hr/panels/leave-panel";
import { PayrollPanel } from "@/components/hr/panels/payroll-panel";
import { NotificationBanner } from "@/components/layout/notification-banner";
import { getPayrollHrNotifications } from "@/lib/actions/payroll";
import {
  requireHrAdmin,
  requirePayrollRead,
} from "@/lib/auth/require-role";
import {
  HR_TABS,
  canAccessHrTab,
  resolveHrTab,
  type HrTab,
} from "@/lib/hr/hub";
import {
  currentPayPeriod,
  parsePayPeriodMonth,
} from "@/lib/payroll/constants";
import {
  canApprovePayrollHrItems,
  formatPayrollBlockedBanner,
  formatPayrollPendingApprovalsBanner,
  formatPayrollUnpaidBanner,
  hrTabPendingCount,
} from "@/lib/payroll/hr-notifications";
import type { AppRole } from "@/lib/roles";

type HrHubPageProps = {
  searchParams: Promise<{
    tab?: string;
    q?: string;
    month?: string;
    page?: string;
  }>;
};

function hubTabLink(tab: HrTab): string {
  return `/hr?tab=${tab}`;
}

async function renderHrPanel(
  tab: HrTab,
  {
    page,
    query,
    payPeriod,
    role,
  }: {
    page: number;
    query: string;
    payPeriod: string;
    role: AppRole;
  },
) {
  switch (tab) {
    case "employees":
      return <EmployeesPanel page={page} query={query} />;
    case "payroll":
      return <PayrollPanel payPeriod={payPeriod} query={query} role={role} />;
    case "leave":
      return <LeavePanel query={query} role={role} />;
    case "advances":
      return <AdvancesPanel query={query} role={role} />;
    case "bonuses":
      return <BonusesPanel payPeriod={payPeriod} query={query} role={role} />;
  }
}

export default async function HrHubPage({ searchParams }: HrHubPageProps) {
  const params = await searchParams;
  const { role, appUser } = await requirePayrollRead();
  const effectiveRole = (appUser?.role ?? role) as AppRole;
  const tab = resolveHrTab(params.tab, effectiveRole);

  if (tab === "employees") {
    await requireHrAdmin();
  }

  const query = params.q ?? "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const payPeriod =
    parsePayPeriodMonth(params.month ?? currentPayPeriod()) ??
    currentPayPeriod();

  const visibleTabs = HR_TABS.filter((t) => canAccessHrTab(t, effectiveRole));
  const panelContext = { page, query, payPeriod, role: effectiveRole };

  const notifications = await getPayrollHrNotifications(payPeriod);
  const canApprove = canApprovePayrollHrItems(effectiveRole);

  const tabPendingCounts: Partial<Record<HrTab, number>> = canApprove
    ? {
        leave: hrTabPendingCount("leave", notifications),
        advances: hrTabPendingCount("advances", notifications),
        bonuses: hrTabPendingCount("bonuses", notifications),
      }
    : {};

  const blockedBanner = formatPayrollBlockedBanner(notifications);
  const pendingApprovalsBanner = canApprove
    ? formatPayrollPendingApprovalsBanner(notifications.pendingApprovalsTotal)
    : null;
  const unpaidBanner = formatPayrollUnpaidBanner(
    notifications.unpaidPayrollEmployees,
  );

  const banners = (
    <>
      {blockedBanner ? (
        <NotificationBanner urgency="urgent">
          {blockedBanner}{" "}
          <Link
            href={hubTabLink("leave")}
            className="font-medium underline underline-offset-2"
          >
            Review leave
          </Link>
          {" · "}
          <Link
            href={hubTabLink("advances")}
            className="font-medium underline underline-offset-2"
          >
            Review advances
          </Link>
          {" · "}
          <Link
            href={hubTabLink("bonuses")}
            className="font-medium underline underline-offset-2"
          >
            Review bonuses
          </Link>
        </NotificationBanner>
      ) : null}
      {pendingApprovalsBanner ? (
        <NotificationBanner urgency="urgent">
          {pendingApprovalsBanner}
        </NotificationBanner>
      ) : null}
      {unpaidBanner ? (
        <NotificationBanner urgency="awareness">{unpaidBanner}</NotificationBanner>
      ) : null}
    </>
  );

  const [panel, actions] = await Promise.all([
    renderHrPanel(tab, panelContext),
    HrHubActions({
      tab,
      payPeriod,
      blockedEmployeeIds: notifications.blockedEmployeeIds,
    }),
  ]);

  return (
    <Suspense
      fallback={
        <div className="px-4 py-16 text-center text-sm text-muted-foreground">
          Loading HR…
        </div>
      }
    >
      <HrHubView
        initialTab={tab}
        visibleTabs={visibleTabs}
        tabPendingCounts={tabPendingCounts}
        banners={banners}
        role={effectiveRole}
        payPeriod={payPeriod}
        query={query}
        page={params.page}
        month={params.month}
        panel={panel}
        actions={actions}
      />
    </Suspense>
  );
}
