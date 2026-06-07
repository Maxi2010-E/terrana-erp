import { PayrollDueBanner } from "@/components/layout/payroll-due-banner";
import { getPayrollDueBannerStatus } from "@/lib/actions/payroll";
import type { AppRole } from "@/lib/roles";

type PayrollDueBannerSlotProps = {
  role: AppRole;
};

export async function PayrollDueBannerSlot({ role }: PayrollDueBannerSlotProps) {
  const payrollDueBanner = await getPayrollDueBannerStatus(role);

  if (!payrollDueBanner) {
    return null;
  }

  return (
    <div
      data-layout="dashboard-payroll-alert"
      className="px-4 pt-4 lg:px-8 lg:pt-6"
    >
      <PayrollDueBanner status={payrollDueBanner} />
    </div>
  );
}
