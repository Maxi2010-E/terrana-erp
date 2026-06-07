import Image from "next/image";

import { TERRANA_LOGO_URL } from "@/lib/brand";
import type { WasteSlipData } from "@/lib/waste/waste-slip-types";
import { terranaColors } from "@/lib/theme";
import { cn } from "@/lib/utils";

type WasteSlipDocumentProps = {
  data: WasteSlipData;
  className?: string;
  variant?: "screen" | "print";
};

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border/60 bg-background px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function formatLoadLine(line: WasteSlipData["lines"][number]): string {
  if (line.numberOfBags <= 0) {
    return line.extraKg > 0
      ? `${line.extraKg.toLocaleString()} kg extra only`
      : "—";
  }

  const parts = [`${line.numberOfBags} bag(s)`];
  if (line.kgPerBag != null && line.kgPerBag > 0) {
    parts.push(`${line.kgPerBag} kg/bag`);
  }
  if (line.extraKg > 0) {
    parts.push(`${line.extraKg.toLocaleString()} kg extra`);
  }

  return parts.join(" · ");
}

export function WasteSlipDocument({
  data,
  className,
  variant = "screen",
}: WasteSlipDocumentProps) {
  return (
    <article
      className={cn(
        "mx-auto w-full bg-white text-foreground shadow-sm",
        variant === "screen" && "min-h-[1056px] max-w-[820px] px-10 py-12",
        variant === "print" && "px-0 py-0",
        className,
      )}
    >
      <header
        className="flex flex-wrap items-start justify-between gap-8 border-b-2 pb-8"
        style={{ borderColor: terranaColors.brand }}
      >
        <div className="min-w-0 space-y-4">
          <Image
            src={TERRANA_LOGO_URL}
            alt="Terrana Africa Ltd"
            width={202}
            height={100}
            className="h-auto w-[min(100%,202px)] object-contain object-left"
            priority
          />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Waste collection slip
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Official record of waste collected from a completed processing
              session — broken flower, bulb, fungus, and other categories.
            </p>
          </div>
        </div>
        <div className="grid min-w-[220px] gap-4">
          <MetaItem label="Processing date" value={data.processingDate} />
          <MetaItem label="Reference" value={data.reference} />
          <MetaItem label="Status" value={data.statusLabel} />
        </div>
      </header>

      <section className="mt-8">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Source session
        </h2>
        <div className="grid gap-px overflow-hidden rounded-lg border border-border/70 bg-border/70 sm:grid-cols-2 lg:grid-cols-3">
          <InfoCell label="Session" value={data.sessionNumber} />
          <InfoCell label="Batch" value={data.batchNumber} />
          <InfoCell label="Supplier" value={data.supplierName} />
          <InfoCell label="Product type" value={data.productType} />
          <InfoCell label="Bags sent" value={String(data.bagsSent)} />
          <InfoCell label="Input kg" value={`${data.inputKg.toLocaleString()} kg`} />
          <InfoCell
            label="Export output"
            value={
              data.outputKg != null
                ? `${data.outputKg.toLocaleString()} kg`
                : "—"
            }
          />
          <InfoCell
            label="Yield"
            value={data.yieldPct != null ? `${data.yieldPct}%` : "—"}
          />
          <InfoCell
            label="Processed by"
            value={data.processedByLabel ?? "—"}
          />
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-lg border border-border/70">
        <div
          className="border-b px-4 py-2.5"
          style={{
            backgroundColor: terranaColors.brand,
            borderColor: terranaColors.brandDark,
          }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white">
            Waste collected
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Category</th>
              <th className="px-4 py-2.5 font-semibold">Load</th>
              <th className="px-4 py-2.5 text-right font-semibold">Total kg</th>
            </tr>
          </thead>
          <tbody>
            {data.lines.map((line, index) => (
              <tr
                key={line.wasteType}
                className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}
              >
                <td className="px-4 py-3 font-medium">{line.label}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatLoadLine(line)}
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">
                  {line.weightKg.toLocaleString()} kg
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border/80 bg-muted/30">
              <td colSpan={2} className="px-4 py-3 text-sm font-semibold">
                Total waste collected
              </td>
              <td className="px-4 py-3 text-right text-sm font-bold tabular-nums">
                {data.totalWasteKg.toLocaleString()} kg
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      <footer className="mt-12 border-t border-border/80 pt-6 text-xs leading-relaxed text-muted-foreground">
        <p>
          This slip documents waste separated during processing. Retain for
          traceability, stocktake, and disposal records. Disposal actions will be
          recorded separately in waste management.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span>Generated {data.generatedAtLabel}</span>
          <span>Terrana Africa Operations System</span>
        </div>
      </footer>
    </article>
  );
}
