import Image from "next/image";

import { formatNaira } from "@/lib/currency";
import { TERRANA_LOGO_URL } from "@/lib/brand";
import { buildPayslipLayout } from "@/lib/payroll/payslip-layout";
import type { PayslipData } from "@/lib/payroll/payslip-types";
import { terranaColors } from "@/lib/theme";
import { cn } from "@/lib/utils";

type PayslipDocumentProps = {
  data: PayslipData;
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

function PayslipTable({
  title,
  rows,
  totalLabel,
  totalAmount,
  emptyLabel,
  amountClassName,
}: {
  title: string;
  rows: Array<{ number: number; label: string; amount: number }>;
  totalLabel: string;
  totalAmount: number;
  emptyLabel: string;
  amountClassName?: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <div
        className="border-b px-4 py-2.5"
        style={{ backgroundColor: terranaColors.brand, borderColor: terranaColors.brandDark }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white">
          {title}
        </h3>
      </div>
      <div className="flex-1 overflow-hidden rounded-b-lg border border-t-0 border-border/70">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-10 px-3 py-2.5 font-semibold">#</th>
              <th className="px-3 py-2.5 font-semibold">Description</th>
              <th className="px-3 py-2.5 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row, index) => (
                <tr
                  key={`${row.number}-${row.label}`}
                  className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}
                >
                  <td className="px-3 py-3 tabular-nums text-muted-foreground">{row.number}</td>
                  <td className="px-3 py-3 font-medium text-foreground">{row.label}</td>
                  <td
                    className={cn(
                      "px-3 py-3 text-right font-semibold tabular-nums",
                      amountClassName,
                    )}
                  >
                    {formatNaira(row.amount)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-8 text-center text-sm text-muted-foreground"
                >
                  {emptyLabel}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-border/80 bg-muted/30">
              <td colSpan={2} className="px-3 py-3 text-sm font-semibold text-foreground">
                {totalLabel}
              </td>
              <td
                className={cn(
                  "px-3 py-3 text-right text-sm font-bold tabular-nums",
                  amountClassName,
                )}
              >
                {formatNaira(totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export function PayslipDocument({
  data,
  className,
  variant = "screen",
}: PayslipDocumentProps) {
  const layout = buildPayslipLayout(data);

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
              Payslip
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Official pay statement for salary, allowances, and deductions for the
              stated pay period.
            </p>
          </div>
        </div>
        <div className="grid min-w-[220px] gap-4">
          <MetaItem label="Pay period" value={data.payPeriodLabel} />
          <MetaItem label="Payment date" value={data.paymentDate} />
          <MetaItem label="Reference" value={data.reference} />
          <MetaItem label="Status" value={data.statusLabel} />
        </div>
      </header>

      <section className="mt-8">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Employee information
        </h2>
        <div className="grid gap-px overflow-hidden rounded-lg border border-border/70 bg-border/70 sm:grid-cols-2 lg:grid-cols-3">
          <InfoCell label="Employee name" value={data.employeeName} />
          <InfoCell label="Employee ID" value={data.employeeCode} />
          <InfoCell label="Department" value={data.departmentLabel} />
          <InfoCell label="Job title" value={data.jobTitle} />
          <InfoCell label="Payment method" value={data.paymentMethod} />
          <InfoCell label="Pay frequency" value="Monthly" />
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <PayslipTable
          title="Earnings"
          rows={layout.earnings}
          totalLabel="Total earnings"
          totalAmount={layout.earningsTotal}
          emptyLabel="No earnings recorded"
        />
        <PayslipTable
          title="Deductions"
          rows={layout.deductions}
          totalLabel="Total deductions"
          totalAmount={layout.deductionsTotal}
          emptyLabel="No deductions this period"
          amountClassName="text-red-700"
        />
      </section>

      <section className="mt-8 overflow-hidden rounded-xl border border-border/80">
        <div className="grid gap-px bg-border/70 sm:grid-cols-3">
          <div className="bg-background px-5 py-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Gross pay
            </p>
            <p className="mt-2 text-xl font-bold tabular-nums text-foreground">
              {formatNaira(data.grossPay)}
            </p>
          </div>
          <div className="bg-background px-5 py-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Total deductions
            </p>
            <p className="mt-2 text-xl font-bold tabular-nums text-red-700">
              -{formatNaira(data.totalDeductions)}
            </p>
          </div>
          <div
            className="px-5 py-4 text-white"
            style={{ backgroundColor: terranaColors.brand }}
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/80">
              Net pay
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              {formatNaira(data.netPay)}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-dashed border-border/80 bg-muted/15 px-5 py-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Attendance summary
        </h2>
        <div className="mt-3 grid gap-4 text-sm sm:grid-cols-3">
          <p>
            <span className="text-muted-foreground">Working days in period: </span>
            <span className="font-semibold">{data.workingDaysInPeriod}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Paid leave days: </span>
            <span className="font-semibold">{data.paidLeaveDays}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Unpaid leave days: </span>
            <span className="font-semibold">{data.unpaidLeaveDays}</span>
          </p>
        </div>
      </section>

      <footer className="mt-12 border-t border-border/80 pt-6 text-xs leading-relaxed text-muted-foreground">
        <p>
          This document is confidential and intended only for the named employee.
          If you believe any amount is incorrect, contact HR within five working
          days of receipt.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span>Generated {data.generatedAtLabel}</span>
          <span>Terrana Africa Operations System</span>
        </div>
      </footer>
    </article>
  );
}
