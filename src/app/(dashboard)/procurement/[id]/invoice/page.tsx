import { notFound } from "next/navigation";

import { SupplyInvoiceDocument } from "@/components/procurement/supply-invoice-document";
import { LinkButton } from "@/components/ui/link-button";
import { requireProcurementRead } from "@/lib/auth/require-role";
import { loadSupplyInvoiceData } from "@/lib/procurement/supply-invoice-data";
import { supplyInvoiceStreamPath } from "@/lib/procurement/supply-invoice-paths";

type SupplyInvoicePageProps = {
  params: Promise<{ id: string }>;
};

export default async function SupplyInvoicePage({ params }: SupplyInvoicePageProps) {
  const { role } = await requireProcurementRead();
  const { id } = await params;
  const data = await loadSupplyInvoiceData(id, role);

  if (!data) {
    notFound();
  }

  return (
    <div className="-mx-4 -mt-4 flex min-h-[calc(100dvh-3rem)] flex-col lg:-mx-8 lg:-mt-8">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b bg-background px-4 py-3 lg:px-8">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Supply invoice</h1>
          <p className="text-sm text-muted-foreground">
            {data.supplierName} · {data.batchNumberDisplay}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton variant="outline" size="sm" href={`/procurement/${id}`}>
            Back to batch
          </LinkButton>
          <LinkButton size="sm" href={`${supplyInvoiceStreamPath(id)}?download=1`}>
            Download PDF
          </LinkButton>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-muted/30 p-6 lg:p-10">
        <SupplyInvoiceDocument data={data} variant="screen" />
      </div>
    </div>
  );
}
