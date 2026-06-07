import { notFound } from "next/navigation";

import { WasteSlipDocument } from "@/components/waste/waste-slip-document";
import { LinkButton } from "@/components/ui/link-button";
import { requireProcessingRead } from "@/lib/auth/require-role";
import { loadWasteSlipData } from "@/lib/waste/waste-slip-data";
import { wasteSlipStreamPath } from "@/lib/waste/waste-slip-paths";

type WasteSlipPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function WasteSlipPage({ params }: WasteSlipPageProps) {
  await requireProcessingRead();
  const { sessionId } = await params;
  const data = await loadWasteSlipData(sessionId);

  if (!data) {
    notFound();
  }

  return (
    <div className="-mx-4 -mt-4 flex min-h-[calc(100dvh-3rem)] flex-col lg:-mx-8 lg:-mt-8">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b bg-background px-4 py-3 lg:px-8">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Waste collection slip
          </h1>
          <p className="text-sm text-muted-foreground">
            {data.sessionNumber} · {data.batchNumber}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton
            variant="outline"
            size="sm"
            href={`/waste/session/${sessionId}`}
          >
            Back to session
          </LinkButton>
          <LinkButton
            size="sm"
            href={`${wasteSlipStreamPath(sessionId)}?download=1`}
          >
            Download PDF
          </LinkButton>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-muted/30 p-6 lg:p-10">
        <WasteSlipDocument data={data} variant="screen" />
      </div>
    </div>
  );
}
