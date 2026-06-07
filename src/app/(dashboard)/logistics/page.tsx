import { Suspense, type ReactNode } from "react";

import { LogisticsHubView } from "@/components/logistics/logistics-hub-view";
import { CostAllocationPanel } from "@/components/logistics/panels/cost-allocation-panel";
import { CustomersPanel } from "@/components/logistics/panels/customers-panel";
import { FumigationPanel } from "@/components/logistics/panels/fumigation-panel";
import { ShipmentsPanel } from "@/components/logistics/panels/shipments-panel";
import { TruckAgentsPanel } from "@/components/logistics/panels/truck-agents-panel";
import { ShipmentDashboardCards } from "@/components/logistics/shipment-dashboard-cards";
import { ShipmentStatusFilters } from "@/components/logistics/shipment-status-filters";
import { SuccessFlash } from "@/components/layout/success-flash";
import { getShipmentDashboardCounts } from "@/lib/actions/shipments";
import { requireLogisticsRead } from "@/lib/auth/require-role";
import {
  SHIPMENT_STATUSES,
  type ShipmentStatus,
} from "@/lib/logistics/constants";
import {
  resolveLogisticsTab,
  type LogisticsHubTab,
} from "@/lib/logistics/hub";
import type { AppRole } from "@/lib/roles";

type LogisticsHubPageProps = {
  searchParams: Promise<{
    tab?: string;
    q?: string;
    page?: string;
    status?: string;
    message?: string;
  }>;
};

function statusFilter(status: string | undefined): ShipmentStatus | undefined {
  if (status && SHIPMENT_STATUSES.includes(status as ShipmentStatus)) {
    return status as ShipmentStatus;
  }
  return undefined;
}

function successMessage(message: string | undefined): string | null {
  if (message === "created") {
    return "Record created successfully.";
  }
  if (message === "updated") {
    return "Record updated successfully.";
  }
  return null;
}

async function ShipmentsToolbar({
  status,
  query,
}: {
  status?: ShipmentStatus;
  query: string;
}) {
  const counts = await getShipmentDashboardCounts();

  return (
    <>
      <div className="px-4 pt-4">
        <ShipmentDashboardCards counts={counts} />
      </div>
      <ShipmentStatusFilters activeStatus={status} query={query} />
    </>
  );
}

export default async function LogisticsHubPage({
  searchParams,
}: LogisticsHubPageProps) {
  const params = await searchParams;
  const { role, appUser } = await requireLogisticsRead();
  const effectiveRole = (appUser?.role ?? role) as AppRole;
  const tab = resolveLogisticsTab(params.tab);
  const query = params.q ?? "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const status = statusFilter(params.status);
  const flash = successMessage(params.message);

  const panelContext = {
    page,
    query,
    status,
    role: effectiveRole,
  };

  const [shipmentsToolbar, panel] = await Promise.all([
    tab === "shipments" ? ShipmentsToolbar({ status, query }) : Promise.resolve(null),
    renderLogisticsPanel(tab, panelContext),
  ]);

  return (
    <Suspense
      fallback={
        <div className="px-4 py-16 text-center text-sm text-muted-foreground">
          Loading logistics…
        </div>
      }
    >
      <LogisticsHubView
        initialTab={tab}
        flash={flash ? <SuccessFlash message={flash} /> : null}
        role={effectiveRole}
        query={query}
        status={params.status}
        page={params.page}
        panel={panel}
        shipmentsToolbar={shipmentsToolbar}
      />
    </Suspense>
  );
}

async function renderLogisticsPanel(
  tab: LogisticsHubTab,
  {
    page,
    query,
    status,
    role,
  }: {
    page: number;
    query: string;
    status?: ShipmentStatus;
    role: AppRole;
  },
) {
  switch (tab) {
    case "shipments":
      return <ShipmentsPanel page={page} query={query} status={status} />;
    case "customers":
      return <CustomersPanel page={page} query={query} role={role} />;
    case "fumigation":
      return <FumigationPanel page={page} query={query} />;
    case "truck-agents":
      return <TruckAgentsPanel page={page} query={query} />;
    case "cost-allocation":
      return <CostAllocationPanel page={page} query={query} />;
  }
}
