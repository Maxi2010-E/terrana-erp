import { AdvanceTableClient } from "@/components/hr/panels/advance-table-client";
import { listAdvanceRecords } from "@/lib/actions/payroll";
import { hasRole, type AppRole } from "@/lib/roles";

type AdvancesPanelProps = {
  query: string;
  role: AppRole;
};

export async function AdvancesPanel({ query, role }: AdvancesPanelProps) {
  const canApprove = hasRole(role, ["super_admin", "admin"]);
  const rows = await listAdvanceRecords();

  return (
    <AdvanceTableClient rows={rows} query={query} canApprove={canApprove} />
  );
}
