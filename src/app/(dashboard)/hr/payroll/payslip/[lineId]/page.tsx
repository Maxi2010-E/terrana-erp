import { notFound } from "next/navigation";

import { PayslipDocument } from "@/components/hr/payslip-document";
import { LinkButton } from "@/components/ui/link-button";
import { loadPayslipData } from "@/lib/payroll/payslip-data";
import { payslipStreamPath } from "@/lib/payroll/payslip-paths";
import { requirePayrollRead } from "@/lib/auth/require-role";

type PayslipPageProps = {
  params: Promise<{ lineId: string }>;
};

export default async function PayslipPage({ params }: PayslipPageProps) {
  await requirePayrollRead();
  const { lineId } = await params;
  const data = await loadPayslipData(lineId);

  if (!data) {
    notFound();
  }

  return (
    <div className="-mx-4 -mt-4 flex min-h-[calc(100dvh-3rem)] flex-col lg:-mx-8 lg:-mt-8">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b bg-background px-4 py-3 lg:px-8">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Payslip</h1>
          <p className="text-sm text-muted-foreground">
            {data.employeeName} · {data.payPeriodLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton variant="outline" size="sm" href="/hr?tab=payroll">
            Back to payroll
          </LinkButton>
          <LinkButton size="sm" href={`${payslipStreamPath(lineId)}?download=1`}>
            Download PDF
          </LinkButton>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-muted/30 p-6 lg:p-10">
        <PayslipDocument data={data} variant="screen" />
      </div>
    </div>
  );
}
