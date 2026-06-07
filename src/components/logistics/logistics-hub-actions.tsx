import { LinkButton } from "@/components/ui/link-button";
import type { LogisticsHubTab } from "@/lib/logistics/hub";
import { canWriteLogistics } from "@/lib/logistics/permissions";
import type { AppRole } from "@/lib/roles";

type LogisticsHubActionsProps = {
  tab: LogisticsHubTab;
  role: AppRole;
};

export function LogisticsHubActions({ tab, role }: LogisticsHubActionsProps) {
  if (!canWriteLogistics(role)) {
    return null;
  }

  switch (tab) {
    case "shipments":
      return (
        <LinkButton href="/logistics/shipments/new">Create shipment</LinkButton>
      );
    case "customers":
      return (
        <LinkButton href="/logistics/customers/new">Add customer</LinkButton>
      );
    case "fumigation":
      return (
        <LinkButton href="/logistics/fumigation/new">Add facility</LinkButton>
      );
    case "truck-agents":
      return (
        <LinkButton href="/logistics/truck-agents/new">Add agent</LinkButton>
      );
    case "cost-allocation":
      return null;
  }
}
