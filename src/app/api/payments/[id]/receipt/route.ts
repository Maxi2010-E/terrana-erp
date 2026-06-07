import { NextResponse } from "next/server";

import { requirePaymentRead } from "@/lib/auth/require-role";
import {
  loadPaymentReceiptData,
  paymentReceiptFilename,
} from "@/lib/payments/payment-receipt-data";
import { generatePaymentReceiptPdf } from "@/lib/payments/payment-receipt-pdf";

type PaymentReceiptRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: PaymentReceiptRouteProps) {
  await requirePaymentRead();
  const { id } = await params;

  const data = await loadPaymentReceiptData(id);
  if (!data) {
    return NextResponse.json({ error: "Payment receipt not found." }, { status: 404 });
  }

  const format = new URL(request.url).searchParams.get("format");
  if (format === "json") {
    return NextResponse.json(data);
  }

  const pdf = await generatePaymentReceiptPdf(data);
  const download = new URL(request.url).searchParams.get("download") === "1";
  const filename = paymentReceiptFilename(data);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
