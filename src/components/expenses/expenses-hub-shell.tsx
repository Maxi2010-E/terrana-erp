import type { ReactNode } from "react";

type ExpensesHubShellProps = {
  pettyCash?: ReactNode;
  tabs: ReactNode;
  search: ReactNode;
  actions: ReactNode;
  flash?: ReactNode;
  banners?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
};

export function ExpensesHubShell({
  pettyCash,
  tabs,
  search,
  actions,
  flash,
  banners,
  toolbar,
  children,
}: ExpensesHubShellProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Expenses
        </h1>
        {pettyCash}
      </div>

      {tabs}

      {banners ? <div className="space-y-3">{banners}</div> : null}

      {flash}

      <div className="flex flex-wrap items-center gap-3">
        {search}
        <div className="ml-auto shrink-0">{actions}</div>
      </div>

      {toolbar}

      <div className="rounded-2xl border border-border/70 bg-card shadow-sm">
        {children}
      </div>
    </div>
  );
}
