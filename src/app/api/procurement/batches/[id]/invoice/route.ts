import { NextResponse } from "next/server";

import { requireProcurementRead } from "@/lib/auth/require-role";
import {
  loadSupplyInvoiceData,
  supplyInvoiceFilename,
} from "@/lib/procurement/supply-invoice-data";
import { generateSupplyInvoicePdf } from "@/lib/procurement/supply-invoice-pdf";

type SupplyInvoiceRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: SupplyInvoiceRouteProps) {
  const { role } = await requireProcurementRead();
  const { id } = await params;

  const data = await loadSupplyInvoiceData(id, role);
  if (!data) {
    return NextResponse.json({ error: "Supply invoice not found." }, { status: 404 });
  }

  const format = new URL(request.url).searchParams.get("format");
  if (format === "json") {
    return NextResponse.json(data);
  }

  const pdf = await generateSupplyInvoicePdf(data);
  const download = new URL(request.url).searchParams.get("download") === "1";
  const filename = supplyInvoiceFilename(data);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
