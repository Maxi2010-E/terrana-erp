import { notFound } from "next/navigation";

import { ProcessingStartForm } from "@/components/processing/processing-start-form";
import { PageHeader } from "@/components/layout/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getProcessingBatchOption,
} from "@/lib/actions/processing";
import { getActiveEmployeesForSelect } from "@/lib/actions/procurement";
import { requireProcessingWrite } from "@/lib/auth/require-role";

type ProcessingNewPageProps = {
  searchParams: Promise<{ batch?: string }>;
};

export default async function ProcessingNewPage({
  searchParams,
}: ProcessingNewPageProps) {
  await requireProcessingWrite();
  const { batch: batchId } = await searchParams;

  if (!batchId) {
    notFound();
  }

  const [batch, employees] = await Promise.all([
    getProcessingBatchOption(batchId),
    getActiveEmployeesForSelect(),
  ]);

  if (!batch) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Start processing"
        meta={`Batch ${batch.batch_number}`}
        actions={
          <LinkButton variant="outline" href="/processing">
            Back to queue
          </LinkButton>
        }
      />

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-base">New session</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-6 pt-5">
          <ProcessingStartForm batch={batch} employees={employees} />
        </CardContent>
      </Card>
    </div>
  );
}
