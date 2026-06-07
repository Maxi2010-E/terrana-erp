import { NextResponse } from "next/server";

import { requireProcessingRead } from "@/lib/auth/require-role";
import { loadWasteSlipData, wasteSlipFilename } from "@/lib/waste/waste-slip-data";
import { generateWasteSlipPdf } from "@/lib/waste/waste-slip-pdf";

type WasteSlipRouteProps = {
  params: Promise<{ sessionId: string }>;
};

export async function GET(request: Request, { params }: WasteSlipRouteProps) {
  await requireProcessingRead();
  const { sessionId } = await params;

  const data = await loadWasteSlipData(sessionId);
  if (!data) {
    return NextResponse.json({ error: "Waste slip not found." }, { status: 404 });
  }

  const format = new URL(request.url).searchParams.get("format");
  if (format === "json") {
    return NextResponse.json(data);
  }

  const pdf = await generateWasteSlipPdf(data);
  const download = new URL(request.url).searchParams.get("download") === "1";
  const filename = wasteSlipFilename(data);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
