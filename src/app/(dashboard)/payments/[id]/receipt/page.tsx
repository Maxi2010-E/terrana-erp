import { notFound } from "next/navigation";

import { PaymentReceiptDocument } from "@/components/payments/payment-receipt-document";
import { LinkButton } from "@/components/ui/link-button";
import { requirePaymentRead } from "@/lib/auth/require-role";
import { loadPaymentReceiptData } from "@/lib/payments/payment-receipt-data";
import { paymentReceiptStreamPath } from "@/lib/payments/payment-receipt-paths";

type PaymentReceiptPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PaymentReceiptPage({ params }: PaymentReceiptPageProps) {
  await requirePaymentRead();
  const { id } = await params;
  const data = await loadPaymentReceiptData(id);

  if (!data) {
    notFound();
  }

  return (
    <div className="-mx-4 -mt-4 flex min-h-[calc(100dvh-3rem)] flex-col lg:-mx-8 lg:-mt-8">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b bg-background px-4 py-3 lg:px-8">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Payment receipt</h1>
          <p className="text-sm text-muted-foreground">
            {data.supplierName} · {data.paymentReference}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton variant="outline" size="sm" href={`/payments/${id}`}>
            Back to payment
          </LinkButton>
          <LinkButton size="sm" href={`${paymentReceiptStreamPath(id)}?download=1`}>
            Download PDF
          </LinkButton>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-muted/30 p-6 lg:p-10">
        <PaymentReceiptDocument data={data} variant="screen" />
      </div>
    </div>
  );
}
