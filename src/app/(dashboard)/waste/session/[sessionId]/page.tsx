import Link from "next/link";
import { notFound } from "next/navigation";

import { ProcessingStatusBadge } from "@/components/processing/processing-status-badge";
import { ProductTypeBadge } from "@/components/procurement/product-type-badge";
import { WasteSlipPreviewDialog } from "@/components/waste/waste-slip-preview-dialog";
import { WasteTypeBadge } from "@/components/waste/waste-type-badge";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProcessingSessionById } from "@/lib/actions/processing";
import {
  sessionHasWaste,
  totalWasteKg,
} from "@/lib/actions/waste";
import { requireProcessingRead } from "@/lib/auth/require-role";
import {
  WASTE_TYPES,
  type ProcessingSessionStatus,
} from "@/lib/processing/constants";

type WasteSessionPageProps = {
  params: Promise<{ sessionId: string }>;
};

function formatLoad(
  numberOfBags: number,
  kgPerBag: number | null,
  extraKg: number,
): string {
  if (numberOfBags <= 0) {
    return extraKg > 0 ? `${extraKg.toLocaleString()} kg extra` : "—";
  }

  const parts = [`${numberOfBags} bag(s)`];
  if (kgPerBag != null && kgPerBag > 0) {
    parts.push(`${kgPerBag} kg/bag`);
  }
  if (extraKg > 0) {
    parts.push(`${extraKg.toLocaleString()} kg extra`);
  }

  return parts.join(" · ");
}

export default async function WasteSessionPage({ params }: WasteSessionPageProps) {
  await requireProcessingRead();
  const { sessionId } = await params;
  const session = await getProcessingSessionById(sessionId);

  if (!session) {
    notFound();
  }

  const hasWaste = sessionHasWaste(session.waste);
  const wasteTotal = totalWasteKg(session.waste);
  const canShowSlip = session.status === "completed" && hasWaste;

  const wasteLines = WASTE_TYPES.flatMap((type) => {
    const entry = session.waste[type];
    if (entry.weight_kg <= 0) {
      return [];
    }

    return [{ type, entry }];
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {session.session_number}
            </h1>
            <ProcessingStatusBadge
              status={session.status as ProcessingSessionStatus}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Batch {session.batch_number} · {session.supplier_name}
          </p>
          <ProductTypeBadge productType={session.product_type} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canShowSlip ? (
            <WasteSlipPreviewDialog
              sessionId={sessionId}
              label="View waste slip"
            />
          ) : null}
          <LinkButton variant="outline" href={`/processing/${sessionId}`}>
            Open processing session
          </LinkButton>
          <LinkButton variant="outline" href="/waste">
            Back to waste
          </LinkButton>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session context</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Processing date</p>
            <p className="font-medium">{session.processing_date}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Bags sent</p>
            <p className="font-medium">{session.bags_sent.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Input kg</p>
            <p className="font-medium">{session.input_kg.toLocaleString()} kg</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Export output</p>
            <p className="font-medium">
              {session.output?.total_kg != null
                ? `${session.output.total_kg.toLocaleString()} kg`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Source batch</p>
            <p className="font-medium">
              <Link
                href={`/procurement/${session.source_batch_id}`}
                className="hover:text-primary hover:underline"
              >
                {session.batch_number}
              </Link>
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total waste</p>
            <p className="font-medium tabular-nums">
              {hasWaste ? `${wasteTotal.toLocaleString()} kg` : "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Waste collected</CardTitle>
        </CardHeader>
        <CardContent>
          {wasteLines.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              No waste recorded on this session yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Category</th>
                    <th className="pb-3 pr-4 font-medium">Load</th>
                    <th className="pb-3 font-medium">Total kg</th>
                  </tr>
                </thead>
                <tbody>
                  {wasteLines.map(({ type, entry }) => (
                    <tr key={type} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <WasteTypeBadge wasteType={type} />
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {formatLoad(
                          entry.number_of_bags,
                          entry.kg_per_bag,
                          entry.extra_kg,
                        )}
                      </td>
                      <td className="py-3 font-medium tabular-nums">
                        {entry.weight_kg.toLocaleString()} kg
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
