import Image from "next/image";

import { formatNaira } from "@/lib/currency";
import { TERRANA_LOGO_URL } from "@/lib/brand";
import type { SupplyInvoiceData } from "@/lib/procurement/supply-invoice-types";
import { terranaColors } from "@/lib/theme";
import { cn } from "@/lib/utils";

type SupplyInvoiceDocumentProps = {
  data: SupplyInvoiceData;
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/50 px-4 py-3 last:border-0 even:bg-muted/20">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

export function SupplyInvoiceDocument({
  data,
  className,
  variant = "screen",
}: SupplyInvoiceDocumentProps) {
  const supplierLines = [
    data.supplierName,
    data.supplierCode,
    data.supplierAddress,
    data.supplierPhone,
  ].filter((line): line is string => Boolean(line?.trim()));

  return (
    <article
      className={cn(
        "mx-auto w-full bg-white text-foreground shadow-sm",
        variant === "screen" && "min-h-[1056px] max-w-[820px] px-10 py-12",
        variant === "print" && "px-0 py-0",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-8 border-b-2 pb-8" style={{ borderColor: terranaColors.brand }}>
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
              Supply Invoice
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Official record of approved raw material supply received from the
              named supplier.
            </p>
          </div>
        </div>
        <div className="grid min-w-[220px] gap-4">
          <MetaItem label="Procurement date" value={data.procurementDate} />
          <MetaItem label="Reference" value={data.reference} />
          <MetaItem label="Status" value={data.statusLabel} />
        </div>
      </header>

      <section className="mt-8">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Supplier
        </h2>
        <div className="rounded-lg border border-border/70 bg-muted/15 px-5 py-4 text-sm leading-relaxed">
          {supplierLines.map((line) => (
            <p key={line} className="font-medium text-foreground">
              {line}
            </p>
          ))}
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-lg border border-border/70">
        <div
          className="border-b px-4 py-2.5"
          style={{ backgroundColor: terranaColors.brand, borderColor: terranaColors.brandDark }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white">
            Supply details
          </h3>
        </div>
        <div>
          <DetailRow label="Batch number" value={data.batchNumberDisplay} />
          <DetailRow label="Procurement type" value={data.procurementTypeLabel} />
          <DetailRow label="Product type" value={data.productType} />
          {data.productConditionLabel ? (
            <DetailRow label="Condition" value={data.productConditionLabel} />
          ) : null}
          {data.productAgeLabel ? (
            <DetailRow label="Age" value={data.productAgeLabel} />
          ) : null}
          {data.productColorLabel ? (
            <DetailRow label="Colour" value={data.productColorLabel} />
          ) : null}
          {data.mixedTypeLabel ? (
            <DetailRow label="Mixed type" value={data.mixedTypeLabel} />
          ) : null}
          <DetailRow label="Number of bags" value={String(data.numberOfBags)} />
          <DetailRow
            label="Kg per bag"
            value={data.kgPerBag != null ? `${data.kgPerBag} kg` : "—"}
          />
          <DetailRow label="Extra kg" value={`${data.extraKg.toLocaleString()} kg`} />
          <DetailRow label="Total kg" value={`${data.totalKg.toLocaleString()} kg`} />
          <DetailRow label="Quality decision" value={data.qualityDecisionLabel} />
          <DetailRow label="Payment status" value={data.paymentStatusLabel} />
          {data.showPricing && data.unitPrice != null && data.totalValue != null ? (
            <>
              <DetailRow label="Unit price" value={formatNaira(data.unitPrice)} />
              <DetailRow label="Total value" value={formatNaira(data.totalValue)} />
            </>
          ) : null}
        </div>
      </section>

      <section className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border/70 bg-border/70 sm:grid-cols-2">
        <div className="bg-background px-5 py-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Approved by
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {data.approvedByName ?? "—"}
          </p>
        </div>
        <div className="bg-background px-5 py-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Approved at
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {data.approvedAtLabel ?? "—"}
          </p>
        </div>
      </section>

      {data.notes ? (
        <section className="mt-8 rounded-lg border border-dashed border-border/80 bg-muted/15 px-5 py-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Notes
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground">{data.notes}</p>
        </section>
      ) : null}

      <footer className="mt-12 border-t border-border/80 pt-6 text-xs leading-relaxed text-muted-foreground">
        <p>
          This invoice documents approved supply received into Terrana operations.
          Use for procurement records, inventory traceability, and supplier
          reconciliation.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span>Generated {data.generatedAtLabel}</span>
          <span>Terrana Africa Operations System</span>
        </div>
      </footer>
    </article>
  );
}
