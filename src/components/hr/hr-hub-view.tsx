"use client";

import { useCallback, type ReactNode } from "react";

import { HrHubActions } from "@/components/hr/hr-hub-actions";
import { HrHubSearch } from "@/components/hr/hr-hub-search";
import { HrHubShell } from "@/components/hr/hr-hub-shell";
import { HR_HUB_TAB_CONFIG } from "@/components/hr/hr-hub-tab-config";
import { HrPayPeriodFilter } from "@/components/hr/hr-pay-period-filter";
import { HubTabList } from "@/components/hub/hub-tab-list";
import { useHubTabState } from "@/components/hub/use-hub-tab-state";
import {
  hrTabSearchPlaceholder,
  resolveHrTab,
  type HrTab,
} from "@/lib/hr/hub";
import { hrTabHref } from "@/lib/hr/hub-url";
import type { AppRole } from "@/lib/roles";

type HrHubViewProps = {
  initialTab: HrTab;
  visibleTabs: HrTab[];
  tabPendingCounts: Partial<Record<HrTab, number>>;
  banners: ReactNode;
  role: AppRole;
  payPeriod: string;
  query: string;
  page?: string;
  month?: string;
  panel: ReactNode;
  actions: ReactNode;
};

export function HrHubView({
  initialTab,
  visibleTabs,
  tabPendingCounts,
  banners,
  role,
  payPeriod,
  query,
  page,
  month,
  panel,
  actions,
}: HrHubViewProps) {
  const resolveFromUrl = useCallback(
    (params: URLSearchParams) =>
      resolveHrTab(params.get("tab") ?? undefined, role),
    [role],
  );

  const { activeTab, switchTab } = useHubTabState(
    initialTab,
    resolveFromUrl,
    hrTabHref,
  );

  return (
    <HrHubShell
      tabs={
        <div className="space-y-3">
          <HubTabList
            tabs={HR_HUB_TAB_CONFIG}
            visibleTabs={visibleTabs}
            activeTab={activeTab}
            tabPendingCounts={tabPendingCounts}
            onTabChange={switchTab}
          />
          {banners}
        </div>
      }
      search={
        <HrHubSearch
          tab={activeTab}
          placeholder={hrTabSearchPlaceholder(activeTab)}
          defaultValue={query}
          preserveParams={{
            month,
            page: activeTab === "employees" ? page : undefined,
          }}
        />
      }
      actions={actions}
    >
      {activeTab === "payroll" || activeTab === "bonuses" ? (
        <HrPayPeriodFilter tab={activeTab} payPeriod={payPeriod} query={query} />
      ) : null}
      {panel}
    </HrHubShell>
  );
}
