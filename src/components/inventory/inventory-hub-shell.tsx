import type { ReactNode } from "react";

type InventoryHubShellProps = {
  tabs: ReactNode;
  search: ReactNode;
  actions: ReactNode;
  flash?: ReactNode;
  banners?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
};

export function InventoryHubShell({
  tabs,
  search,
  actions,
  flash,
  banners,
  toolbar,
  children,
}: InventoryHubShellProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Inventory
      </h1>

      {tabs}

      {banners ? (
        <div className="space-y-3 [&>:empty]:hidden">{banners}</div>
      ) : null}

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
