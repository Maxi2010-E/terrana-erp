import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrendPoint } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

type ReportsTrendPanelProps = {
  title: string;
  description: string;
  points: TrendPoint[];
  valueLabel?: (value: number) => string;
  accentClassName?: string;
};

function defaultValueLabel(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function ReportsTrendPanel({
  title,
  description,
  points,
  valueLabel = defaultValueLabel,
  accentClassName = "bg-primary",
}: ReportsTrendPanelProps) {
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const periodTotal = points.reduce((sum, point) => sum + point.value, 0);
  const hasData = periodTotal > 0;

  return (
    <Card className="shadow-sm">
      <CardHeader className="gap-2 border-b border-border/60 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            Last 6 months
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        {!hasData ? (
          <p className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            No approved records in the last six months.
          </p>
        ) : (
          <div className="space-y-3">
            {points.map((point) => {
              const width = Math.max(4, Math.round((point.value / maxValue) * 100));
              return (
                <div
                  key={point.monthKey}
                  className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[4rem_minmax(0,1fr)_auto]"
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    {point.label}
                  </span>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full transition-all", accentClassName)}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="min-w-[4.5rem] text-right text-sm tabular-nums font-medium">
                    {valueLabel(point.value)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border/60 pt-4 text-sm">
          <span className="text-muted-foreground">6-month total</span>
          <span className="font-semibold tabular-nums">{valueLabel(periodTotal)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
