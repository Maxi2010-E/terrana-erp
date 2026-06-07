import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { WasteReprocessingStartForm } from "@/components/waste/waste-reprocessing-start-form";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWasteReprocessingSourceOption } from "@/lib/actions/waste-reprocessing";
import { getActiveEmployeesForSelect } from "@/lib/actions/procurement";
import { requireProcessingWrite } from "@/lib/auth/require-role";
import type { WasteSourceKind } from "@/lib/waste/reprocessing-constants";

type WasteReprocessingNewPageProps = {
  searchParams: Promise<{
    source?: string;
    kind?: string;
  }>;
};

function parseSourceKind(value: string | undefined): WasteSourceKind | null {
  if (value === "collection" || value === "byproduct") {
    return value;
  }
  return null;
}

export default async function WasteReprocessingNewPage({
  searchParams,
}: WasteReprocessingNewPageProps) {
  await requireProcessingWrite();
  const { source: sourceId, kind } = await searchParams;
  const sourceKind = parseSourceKind(kind);

  if (!sourceId || !sourceKind) {
    notFound();
  }

  const [source, employees] = await Promise.all([
    getWasteReprocessingSourceOption(sourceId, sourceKind),
    getActiveEmployeesForSelect(),
  ]);

  if (!source) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Start waste re-processing"
        meta={`${source.origin_session_number} · ${source.local_product_label}`}
        actions={
          <LinkButton variant="outline" href="/waste?view=processing">
            Back to queue
          </LinkButton>
        }
      />

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-base">New session</CardTitle>
          <p className="text-sm text-muted-foreground">
            Submit for admin approval before recording output and secondary
            waste.
          </p>
        </CardHeader>
        <CardContent className="px-4 pb-6 pt-5">
          <WasteReprocessingStartForm source={source} employees={employees} />
        </CardContent>
      </Card>
    </div>
  );
}
