import { LinkButton } from "@/components/ui/link-button";
import { canWriteInventoryRole } from "@/lib/inventory/permissions";
import type { InventoryHubTab } from "@/lib/inventory/hub";
import type { AppRole } from "@/lib/roles";

type InventoryHubActionsProps = {
  tab: InventoryHubTab;
  role: AppRole;
};

export function InventoryHubActions({ tab, role }: InventoryHubActionsProps) {
  if (!canWriteInventoryRole(role)) {
    return null;
  }

  if (tab === "pre_stock" || tab === "export") {
    return (
      <LinkButton href="/inventory/export/new" size="default">
        {tab === "pre_stock" ? "Grade to export inventory" : "Create inventory batch"}
      </LinkButton>
    );
  }

  return (
    <LinkButton href="/inventory/warehouse-lots/new" size="default">
      Add warehouse lot
    </LinkButton>
  );
}
