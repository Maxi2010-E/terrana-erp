import Image from "next/image";

import { formatNaira } from "@/lib/currency";
import { TERRANA_LOGO_URL } from "@/lib/brand";
import type { PaymentReceiptData } from "@/lib/payments/payment-receipt-types";
import { terranaColors } from "@/lib/theme";
import { cn } from "@/lib/utils";

type PaymentReceiptDocumentProps = {
  data: PaymentReceiptData;
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

export function PaymentReceiptDocument({
  data,
  className,
  variant = "screen",
}: PaymentReceiptDocumentProps) {
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
              Payment Receipt
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Official confirmation of an approved supplier payment against a
              procurement batch.
            </p>
          </div>
        </div>
        <div className="grid min-w-[220px] gap-4">
          <MetaItem label="Payment date" value={data.paymentDate} />
          <MetaItem label="Reference" value={data.reference} />
          <MetaItem label="Status" value={data.statusLabel} />
        </div>
      </header>

      <section className="mt-8">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Supplier
        </h2>
        <div className="grid gap-px overflow-hidden rounded-lg border border-border/70 bg-border/70 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCell label="Supplier" value={data.supplierName} />
          <InfoCell label="Supplier code" value={data.supplierCode} />
          <InfoCell label="Address" value={data.supplierAddress ?? "—"} />
          <InfoCell label="Phone" value={data.supplierPhone ?? "—"} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Payment details
        </h2>
        <div className="grid gap-px overflow-hidden rounded-lg border border-border/70 bg-border/70 sm:grid-cols-2 lg:grid-cols-3">
          <InfoCell label="Amount paid" value={formatNaira(data.amount)} />
          <InfoCell label="Payment method" value={data.paymentMethodLabel} />
          <InfoCell
            label="Payout account"
            value={data.payoutAccountLabel ?? "—"}
          />
          <InfoCell label="Recorded by" value={data.recordedByName ?? "—"} />
          <InfoCell label="Approved by" value={data.approvedByName ?? "—"} />
          <InfoCell label="Approved at" value={data.approvedAtLabel ?? "—"} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Linked batch
        </h2>
        <div className="grid gap-px overflow-hidden rounded-lg border border-border/70 bg-border/70 sm:grid-cols-2 lg:grid-cols-3">
          <InfoCell label="Batch" value={data.batchNumberDisplay} />
          <InfoCell label="Product type" value={data.productType} />
          <InfoCell label="Batch value" value={formatNaira(data.batchValue)} />
          <InfoCell label="Total paid" value={formatNaira(data.paidTotal)} />
          <InfoCell label="Outstanding" value={formatNaira(data.outstanding)} />
        </div>
      </section>

      <section
        className="mt-10 rounded-xl px-6 py-5 text-white"
        style={{ backgroundColor: terranaColors.brand }}
      >
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/80">
          Amount received
        </p>
        <p className="mt-2 text-3xl font-bold tabular-nums">
          {formatNaira(data.amount)}
        </p>
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
          This receipt confirms an approved payment recorded in Terrana Operations.
          Retain for supplier reconciliation and audit purposes.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span>Generated {data.generatedAtLabel}</span>
          <span>Terrana Africa Operations System</span>
        </div>
      </footer>
    </article>
  );
}
