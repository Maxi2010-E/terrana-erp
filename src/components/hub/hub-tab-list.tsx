"use client";

import type { LucideIcon } from "lucide-react";

import { formatNotificationCount } from "@/lib/notifications/dual-badges";
import {
  notificationBadgeClassName,
  notificationBadgeStyle,
} from "@/lib/notifications/urgency";
import { cn } from "@/lib/utils";

export type HubTabConfig<T extends string> = {
  id: T;
  label: string;
  icon: LucideIcon;
};

type HubTabListProps<T extends string> = {
  tabs: HubTabConfig<T>[];
  visibleTabs?: T[];
  activeTab: T;
  tabPendingCounts?: Partial<Record<T, number>>;
  tabReadyCounts?: Partial<Record<T, number>>;
  onTabChange: (tab: T) => void;
};

export function HubTabList<T extends string>({
  tabs,
  visibleTabs,
  activeTab,
  tabPendingCounts,
  tabReadyCounts,
  onTabChange,
}: HubTabListProps<T>) {
  const items = visibleTabs
    ? tabs.filter((tab) => visibleTabs.includes(tab.id))
    : tabs;

  return (
    <div
      className="inline-flex flex-wrap gap-1 rounded-xl border border-border/70 bg-muted/40 p-1"
      role="tablist"
    >
      {items.map((tab) => {
        const isActive = tab.id === activeTab;
        const pending = tabPendingCounts?.[tab.id] ?? 0;
        const ready = tabReadyCounts?.[tab.id] ?? 0;
        const pendingLabel = formatNotificationCount(pending);
        const readyLabel = formatNotificationCount(ready);

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
            )}
          >
            <tab.icon className="size-4 shrink-0" />
            {tab.label}
            {pendingLabel ? (
              <span
                className={notificationBadgeClassName()}
                style={notificationBadgeStyle("urgent", isActive)}
              >
                {pendingLabel}
              </span>
            ) : null}
            {readyLabel ? (
              <span
                className={notificationBadgeClassName()}
                style={notificationBadgeStyle("ready", isActive)}
              >
                {readyLabel}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
