import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardKpi } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

type DashboardKpiGridProps = {
  kpis: DashboardKpi[];
};

export function DashboardKpiGrid({ kpis }: DashboardKpiGridProps) {
  if (kpis.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => {
        const card = (
          <Card className={cn("border-l-4 shadow-sm", kpi.accent)}>
            <CardHeader className="pb-2">
              <CardDescription>{kpi.title}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{kpi.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{kpi.note}</p>
            </CardContent>
          </Card>
        );

        if (!kpi.href) {
          return <div key={kpi.key}>{card}</div>;
        }

        return (
          <Link
            key={kpi.key}
            href={kpi.href}
            prefetch={false}
            className="block transition-opacity hover:opacity-90"
          >
            {card}
          </Link>
        );
      })}
    </div>
  );
}
