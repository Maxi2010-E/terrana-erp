"use client";

import { ExternalLink, FileText } from "lucide-react";
import { useState } from "react";

import { SupplyInvoiceDocument } from "@/components/procurement/supply-invoice-document";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supplyInvoiceStreamPath } from "@/lib/procurement/supply-invoice-paths";
import type { SupplyInvoiceData } from "@/lib/procurement/supply-invoice-types";
import { cn } from "@/lib/utils";

type SupplyInvoicePreviewDialogProps = {
  batchId: string;
  className?: string;
  label?: string;
};

export function SupplyInvoicePreviewDialog({
  batchId,
  className,
  label = "Supply invoice",
}: SupplyInvoicePreviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<SupplyInvoiceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPreview() {
    setOpen(true);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${supplyInvoiceStreamPath(batchId)}?format=json`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error("Could not load supply invoice.");
      }

      const payload = (await response.json()) as SupplyInvoiceData;
      setData(payload);
    } catch (loadError) {
      setData(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load supply invoice.",
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
                <DialogTitle>Supply invoice</DialogTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Full A4 invoice — review before printing or download.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <LinkButton
                  href={`/procurement/${batchId}/invoice`}
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
                      `${supplyInvoiceStreamPath(batchId)}?download=1`,
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
                Loading invoice…
              </p>
            ) : null}

            {error ? (
              <p className="py-8 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            {data ? (
              <div
                id="supply-invoice-print-root"
                className="mx-auto w-fit rounded-xl border border-border/70 bg-muted/20 p-4 shadow-sm print:border-0 print:bg-white print:p-0 print:shadow-none"
              >
                <SupplyInvoiceDocument data={data} variant="screen" />
              </div>
            ) : null}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
