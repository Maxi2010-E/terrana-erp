import { BonusTableClient } from "@/components/hr/panels/bonus-table-client";
import { listBonusRecords } from "@/lib/actions/payroll";
import { hasRole, type AppRole } from "@/lib/roles";

type BonusesPanelProps = {
  payPeriod: string;
  query: string;
  role: AppRole;
};

export async function BonusesPanel({
  payPeriod,
  query,
  role,
}: BonusesPanelProps) {
  const canApprove = hasRole(role, ["super_admin", "admin"]);
  const rows = await listBonusRecords(payPeriod);

  return (
    <BonusTableClient rows={rows} query={query} canApprove={canApprove} />
  );
}
