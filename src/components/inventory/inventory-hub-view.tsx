"use client";

import { useCallback, type ReactNode } from "react";

import { InventoryHubActions } from "@/components/inventory/inventory-hub-actions";
import { InventoryHubSearch } from "@/components/inventory/inventory-hub-search";
import { InventoryHubShell } from "@/components/inventory/inventory-hub-shell";
import { INVENTORY_HUB_TAB_CONFIG } from "@/components/inventory/inventory-hub-tab-config";
import { HubTabList } from "@/components/hub/hub-tab-list";
import { useHubTabState } from "@/components/hub/use-hub-tab-state";
import {
  inventoryTabSearchPlaceholder,
  resolveInventoryTab,
  type InventoryHubTab,
} from "@/lib/inventory/hub";
import { inventoryTabHref } from "@/lib/inventory/hub-url";
import type { AppRole } from "@/lib/roles";

type InventoryHubViewProps = {
  initialTab: InventoryHubTab;
  tabAwarenessCounts?: Partial<Record<InventoryHubTab, number>>;
  preStockBanner: ReactNode;
  exportLotBanner: ReactNode;
  flash: ReactNode;
  query: string;
  status?: string;
  page?: string;
  mix?: string;
  gradedFrom?: string;
  gradedTo?: string;
  panel: ReactNode;
  role: AppRole;
};

export function InventoryHubView({
  initialTab,
  tabAwarenessCounts,
  preStockBanner,
  exportLotBanner,
  flash,
  query,
  status,
  page,
  mix,
  gradedFrom,
  gradedTo,
  panel,
  role,
}: InventoryHubViewProps) {
  const resolveFromUrl = useCallback(
    (params: URLSearchParams) =>
      resolveInventoryTab(params.get("tab") ?? undefined),
    [],
  );

  const { activeTab, switchTab } = useHubTabState(
    initialTab,
    resolveFromUrl,
    inventoryTabHref,
  );

  return (
    <InventoryHubShell
      tabs={
        <HubTabList
          tabs={INVENTORY_HUB_TAB_CONFIG}
          activeTab={activeTab}
          tabPendingCounts={tabAwarenessCounts}
          onTabChange={switchTab}
        />
      }
      banners={
        <>
          {exportLotBanner}
          {activeTab === "pre_stock" ? preStockBanner : null}
        </>
      }
      flash={flash}
      search={
        <InventoryHubSearch
          tab={activeTab}
          placeholder={inventoryTabSearchPlaceholder(activeTab)}
          defaultValue={query}
          preserveParams={{
            status: activeTab === "pre_stock" ? status : undefined,
            page,
            mix: activeTab === "export" ? mix : undefined,
            graded_from: activeTab === "export" ? gradedFrom : undefined,
            graded_to: activeTab === "export" ? gradedTo : undefined,
          }}
        />
      }
      actions={<InventoryHubActions tab={activeTab} role={role} />}
    >
      {panel}
    </InventoryHubShell>
  );
}
