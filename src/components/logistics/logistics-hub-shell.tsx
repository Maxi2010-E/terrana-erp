import type { ReactNode } from "react";

type LogisticsHubShellProps = {
  tabs: ReactNode;
  search: ReactNode;
  actions: ReactNode;
  flash?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
};

export function LogisticsHubShell({
  tabs,
  search,
  actions,
  flash,
  toolbar,
  children,
}: LogisticsHubShellProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Logistics
        </h1>
      </div>

      {tabs}

      {flash}

      <div className="flex flex-wrap items-center gap-3">
        {search}
        <div className="ml-auto shrink-0">{actions}</div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card shadow-sm">
        {toolbar}
        {children}
      </div>
    </div>
  );
}
