import type { ReactNode } from "react";

type HrHubShellProps = {
  tabs: ReactNode;
  search: ReactNode;
  actions: ReactNode;
  banners?: ReactNode;
  children: ReactNode;
};

export function HrHubShell({
  tabs,
  search,
  actions,
  banners,
  children,
}: HrHubShellProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Employees, Payroll, Leave & Benefits
        </h1>
      </div>

      {tabs}

      {banners ? <div className="space-y-3">{banners}</div> : null}

      <div className="flex flex-wrap items-center gap-3">
        {search}
        <div className="ml-auto shrink-0">{actions}</div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card shadow-sm">
        {children}
      </div>
    </div>
  );
}
