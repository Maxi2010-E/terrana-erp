"use client";

import { ExternalLink, FileText } from "lucide-react";
import { useState } from "react";

import { WasteSlipDocument } from "@/components/waste/waste-slip-document";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WasteSlipData } from "@/lib/waste/waste-slip-types";
import { wasteSlipStreamPath } from "@/lib/waste/waste-slip-paths";
import { cn } from "@/lib/utils";

type WasteSlipPreviewDialogProps = {
  sessionId: string;
  className?: string;
  label?: string;
};

export function WasteSlipPreviewDialog({
  sessionId,
  className,
  label = "Slip",
}: WasteSlipPreviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<WasteSlipData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPreview() {
    setOpen(true);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${wasteSlipStreamPath(sessionId)}?format=json`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error("Could not load waste slip.");
      }

      const payload = (await response.json()) as WasteSlipData;
      setData(payload);
    } catch (loadError) {
      setData(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load waste slip.",
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
                <DialogTitle>Waste collection slip</DialogTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Full A4 slip — review before printing or download.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <LinkButton
                  href={`/waste/session/${sessionId}/slip`}
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
                      `${wasteSlipStreamPath(sessionId)}?download=1`,
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
                Loading slip…
              </p>
            ) : null}

            {error ? (
              <p className="py-8 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            {data ? (
              <div
                id="waste-slip-print-root"
                className="mx-auto w-fit rounded-xl border border-border/70 bg-muted/20 p-4 shadow-sm print:border-0 print:bg-white print:p-0 print:shadow-none"
              >
                <WasteSlipDocument data={data} variant="screen" />
              </div>
            ) : null}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
