import { NextResponse } from "next/server";

import { requirePayrollRead } from "@/lib/auth/require-role";
import { loadPayslipData, payslipFilename } from "@/lib/payroll/payslip-data";
import { generatePayslipPdf } from "@/lib/payroll/payslip-pdf";

type PayslipRouteProps = {
  params: Promise<{ lineId: string }>;
};

export async function GET(request: Request, { params }: PayslipRouteProps) {
  await requirePayrollRead();
  const { lineId } = await params;

  const data = await loadPayslipData(lineId);
  if (!data) {
    return NextResponse.json({ error: "Payslip not found." }, { status: 404 });
  }

  const format = new URL(request.url).searchParams.get("format");
  if (format === "json") {
    return NextResponse.json(data);
  }

  const pdf = await generatePayslipPdf(data);
  const download = new URL(request.url).searchParams.get("download") === "1";
  const filename = payslipFilename(data);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
