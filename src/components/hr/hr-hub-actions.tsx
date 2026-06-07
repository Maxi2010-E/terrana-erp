import { AdvanceCreateDialog } from "@/components/hr/advance-create-dialog";
import { BonusCreateDialog } from "@/components/hr/bonus-create-dialog";
import { LeaveCreateDialog } from "@/components/hr/leave-create-dialog";
import { EmployeesPanelActions } from "@/components/hr/panels/employees-panel";
import { PayrollCreateDialog } from "@/components/hr/payroll-create-dialog";
import {
  getEmployeesForPayrollSelect,
  getPaidEmployeeIdsForPayrollPeriod,
} from "@/lib/actions/payroll";
import type { HrTab } from "@/lib/hr/hub";

type HrHubActionsProps = {
  tab: HrTab;
  payPeriod: string;
  blockedEmployeeIds: string[];
};

export async function HrHubActions({
  tab,
  payPeriod,
  blockedEmployeeIds,
}: HrHubActionsProps) {
  if (tab === "employees") {
    return <EmployeesPanelActions />;
  }

  const employees = await getEmployeesForPayrollSelect();

  if (tab === "leave") {
    return <LeaveCreateDialog employees={employees} />;
  }

  if (tab === "advances") {
    return <AdvanceCreateDialog employees={employees} />;
  }

  if (tab === "bonuses") {
    return <BonusCreateDialog employees={employees} payPeriod={payPeriod} />;
  }

  if (tab === "payroll") {
    const paidEmployeeIds = await getPaidEmployeeIdsForPayrollPeriod(payPeriod);

    return (
      <PayrollCreateDialog
        employees={employees}
        payPeriod={payPeriod}
        paidEmployeeIds={paidEmployeeIds}
        blockedEmployeeIds={blockedEmployeeIds}
      />
    );
  }

  return null;
}
