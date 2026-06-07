import Link from "next/link";

import { formatNotificationCount } from "@/lib/notifications/dual-badges";
import {
  notificationBadgeClassName,
  notificationColors,
} from "@/lib/notifications/urgency";
import { cn } from "@/lib/utils";

type PaymentViewTabsProps = {
  view: "queue" | "history";
  historyStatus: "all" | "pending_approval" | "approved";
  queueFilter: string;
  pendingApprovalCount: number;
};

export function PaymentViewTabs({
  view,
  historyStatus,
  queueFilter,
  pendingApprovalCount,
}: PaymentViewTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/payments?view=queue&filter=${queueFilter}`}
        className={cn(
          "rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
          view === "queue"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        Payment queue
      </Link>
      <Link
        href="/payments?view=history"
        className={cn(
          "rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
          view === "history" && historyStatus === "all"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        All records
      </Link>
      <Link
        href="/payments?view=history&status=pending_approval"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
          view === "history" && historyStatus === "pending_approval"
            ? "bg-primary text-primary-foreground"
            : pendingApprovalCount > 0
              ? "notification-tab-urgent"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        Pending approval
        {pendingApprovalCount > 0 ? (
          <span
            className={notificationBadgeClassName()}
            style={{
              backgroundColor: notificationColors.urgent.background,
              color: notificationColors.urgent.foreground,
              ...(view === "history" && historyStatus === "pending_approval"
                ? {
                    boxShadow: `inset 0 0 0 2px ${notificationColors.urgent.activeRing}`,
                  }
                : {}),
            }}
          >
            {formatNotificationCount(pendingApprovalCount)}
          </span>
        ) : null}
      </Link>
    </div>
  );
}
