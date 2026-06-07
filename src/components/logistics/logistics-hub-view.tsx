"use client";

import { useCallback, type ReactNode } from "react";

import { LogisticsHubActions } from "@/components/logistics/logistics-hub-actions";
import { LogisticsHubSearch } from "@/components/logistics/logistics-hub-search";
import { LogisticsHubShell } from "@/components/logistics/logistics-hub-shell";
import { LOGISTICS_HUB_TAB_CONFIG } from "@/components/logistics/logistics-hub-tab-config";
import { HubTabList } from "@/components/hub/hub-tab-list";
import { useHubTabState } from "@/components/hub/use-hub-tab-state";
import {
  logisticsTabSearchPlaceholder,
  resolveLogisticsTab,
  type LogisticsHubTab,
} from "@/lib/logistics/hub";
import { logisticsTabHref } from "@/lib/logistics/hub-url";
import type { AppRole } from "@/lib/roles";

type LogisticsHubViewProps = {
  initialTab: LogisticsHubTab;
  flash: ReactNode;
  role: AppRole;
  query: string;
  status?: string;
  page?: string;
  panel: ReactNode;
  shipmentsToolbar: ReactNode | null;
};

export function LogisticsHubView({
  initialTab,
  flash,
  role,
  query,
  status,
  page,
  panel,
  shipmentsToolbar,
}: LogisticsHubViewProps) {
  const resolveFromUrl = useCallback(
    (params: URLSearchParams) =>
      resolveLogisticsTab(params.get("tab") ?? undefined),
    [],
  );

  const { activeTab, switchTab } = useHubTabState(
    initialTab,
    resolveFromUrl,
    logisticsTabHref,
  );

  return (
    <LogisticsHubShell
      tabs={
        <HubTabList
          tabs={LOGISTICS_HUB_TAB_CONFIG}
          activeTab={activeTab}
          onTabChange={switchTab}
        />
      }
      flash={flash}
      search={
        <LogisticsHubSearch
          tab={activeTab}
          placeholder={logisticsTabSearchPlaceholder(activeTab)}
          defaultValue={query}
          preserveParams={{
            status: activeTab === "shipments" ? status : undefined,
            page,
          }}
        />
      }
      actions={<LogisticsHubActions tab={activeTab} role={role} />}
      toolbar={activeTab === "shipments" ? shipmentsToolbar : null}
    >
      {panel}
    </LogisticsHubShell>
  );
}
