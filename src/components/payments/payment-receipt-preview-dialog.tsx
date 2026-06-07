"use client";

import { ExternalLink, FileText } from "lucide-react";
import { useState } from "react";

import { PaymentReceiptDocument } from "@/components/payments/payment-receipt-document";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { paymentReceiptStreamPath } from "@/lib/payments/payment-receipt-paths";
import type { PaymentReceiptData } from "@/lib/payments/payment-receipt-types";
import { cn } from "@/lib/utils";

type PaymentReceiptPreviewDialogProps = {
  paymentId: string;
  className?: string;
  label?: string;
};

export function PaymentReceiptPreviewDialog({
  paymentId,
  className,
  label = "Receipt",
}: PaymentReceiptPreviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<PaymentReceiptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPreview() {
    setOpen(true);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${paymentReceiptStreamPath(paymentId)}?format=json`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error("Could not load payment receipt.");
      }

      const payload = (await response.json()) as PaymentReceiptData;
      setData(payload);
    } catch (loadError) {
      setData(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load payment receipt.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void openPreview()}
        className={cn(
          "inline-flex shrink-0 font-medium text-primary underline-offset-4 hover:underline",
          className,
        )}
      >
        {label}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-[min(94vh,980px)] w-[min(calc(100vw-1.5rem),980px)] max-w-none flex-col print:h-auto print:max-h-none">
          <DialogHeader className="shrink-0 print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 pr-10">
              <div>
                <DialogTitle>Payment receipt</DialogTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Full A4 receipt — review before printing or download.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <LinkButton
                  href={`/payments/${paymentId}/receipt`}
                  size="sm"
                  variant="outline"
                  target="_blank"
                >
                  <ExternalLink />
                  Open full
                </LinkButton>
                <Button
                  type="button"
                  size="sm"
                  onClick={handlePrint}
                  disabled={!data || loading}
                >
                  <FileText />
                  Print
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!data || loading}
                  onClick={() =>
                    window.open(
                      `${paymentReceiptStreamPath(paymentId)}?download=1`,
                      "_blank",
                    )
                  }
                >
                  Download PDF
                </Button>
              </div>
            </div>
          </DialogHeader>

          <DialogBody className="min-h-0 flex-1 overflow-y-auto bg-muted/30 p-4 print:overflow-visible print:bg-white print:p-0">
            {loading ? (
              <p className="py-24 text-center text-sm text-muted-foreground">
                Loading receipt…
              </p>
            ) : null}

            {error ? (
              <p className="py-8 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            {data ? (
              <div
                id="payment-receipt-print-root"
                className="mx-auto w-fit rounded-xl border border-border/70 bg-muted/20 p-4 shadow-sm print:border-0 print:bg-white print:p-0 print:shadow-none"
              >
                <PaymentReceiptDocument data={data} variant="screen" />
              </div>
            ) : null}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
