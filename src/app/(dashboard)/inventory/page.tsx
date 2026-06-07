import { Suspense } from "react";

import { InventoryHubView } from "@/components/inventory/inventory-hub-view";
import { ExportInventoryPanel } from "@/components/inventory/panels/export-inventory-panel";
import { PreStockPanel } from "@/components/inventory/panels/pre-stock-panel";
import { WarehouseLotsPanel } from "@/components/inventory/panels/warehouse-lots-panel";
import { NotificationBanner } from "@/components/layout/notification-banner";
import { SuccessFlash } from "@/components/layout/success-flash";
import {
  getExportLotAssignmentNotifications,
  getPreStockNotifications,
} from "@/lib/actions/inventory";
import { requireInventoryRead } from "@/lib/auth/require-role";
import { resolveInventoryTab } from "@/lib/inventory/hub";
import {
  formatExportLotAssignmentBanner,
  formatPreStockAwarenessBanner,
} from "@/lib/inventory/notifications";

type InventoryHubPageProps = {
  searchParams: Promise<{
    tab?: string;
    page?: string;
    q?: string;
    message?: string;
    status?: string;
    mix?: string;
    graded_from?: string;
    graded_to?: string;
  }>;
};

function successMessage(message: string | undefined): string | null {
  if (message === "created") {
    return "Export inventory batch created successfully.";
  }
  if (message === "lot_created") {
    return "Warehouse lot created successfully.";
  }
  if (message === "lot_updated") {
    return "Warehouse lot updated successfully.";
  }
  return null;
}

export default async function InventoryHubPage({
  searchParams,
}: InventoryHubPageProps) {
  const { role } = await requireInventoryRead();
  const params = await searchParams;
  const tab = resolveInventoryTab(params.tab);
  const query = params.q ?? "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const showMixDetails = params.mix === "1";
  const gradedFrom = params.graded_from?.trim() || undefined;
  const gradedTo = params.graded_to?.trim() || undefined;
  const flash = successMessage(params.message);

  const [preStockNotifications, exportLotNotifications] = await Promise.all([
    getPreStockNotifications(),
    getExportLotAssignmentNotifications(),
  ]);
  const preStockBannerText = formatPreStockAwarenessBanner(preStockNotifications);
  const exportLotBannerText = formatExportLotAssignmentBanner(exportLotNotifications);
  const tabAwarenessCounts: Partial<
    Record<"pre_stock" | "export" | "warehouse_lots", number>
  > = {};
  if (preStockNotifications.availableLots > 0) {
    tabAwarenessCounts.pre_stock = preStockNotifications.availableLots;
  }
  if (exportLotNotifications.unassignedBatches > 0) {
    tabAwarenessCounts.export = exportLotNotifications.unassignedBatches;
  }

  const activePanel = await renderInventoryPanel(tab, {
    page,
    query,
    status: params.status,
    showMixDetails,
    gradedFrom,
    gradedTo,
  });

  return (
    <Suspense
      fallback={
        <div className="px-4 py-16 text-center text-sm text-muted-foreground">
          Loading inventory…
        </div>
      }
    >
      <InventoryHubView
        initialTab={tab}
        tabAwarenessCounts={
          Object.keys(tabAwarenessCounts).length > 0 ? tabAwarenessCounts : undefined
        }
        preStockBanner={
          preStockBannerText ? (
            <NotificationBanner urgency="awareness">{preStockBannerText}</NotificationBanner>
          ) : null
        }
        exportLotBanner={
          exportLotBannerText ? (
            <NotificationBanner urgency="awareness">{exportLotBannerText}</NotificationBanner>
          ) : null
        }
        flash={flash ? <SuccessFlash message={flash} /> : null}
        query={query}
        status={params.status}
        page={params.page}
        mix={params.mix}
        gradedFrom={gradedFrom}
        gradedTo={gradedTo}
        panel={activePanel}
        role={role}
      />
    </Suspense>
  );
}

async function renderInventoryPanel(
  tab: ReturnType<typeof resolveInventoryTab>,
  context: {
    page: number;
    query: string;
    status?: string;
    showMixDetails: boolean;
    gradedFrom?: string;
    gradedTo?: string;
  },
) {
  switch (tab) {
    case "pre_stock":
      return PreStockPanel({
        page: context.page,
        query: context.query,
        status: context.status,
      });
    case "export":
      return ExportInventoryPanel({
        page: context.page,
        query: context.query,
        showMixDetails: context.showMixDetails,
        gradedFrom: context.gradedFrom,
        gradedTo: context.gradedTo,
      });
    case "warehouse_lots":
      return WarehouseLotsPanel({ page: context.page, query: context.query });
  }
}
