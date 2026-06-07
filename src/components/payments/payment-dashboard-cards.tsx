import Link from "next/link";

import type { PaymentDashboardCounts } from "@/lib/payments/types";
import {
  formatPaymentPendingDashboardStripSubtitle,
  formatPaymentPendingDashboardStripTitle,
} from "@/lib/payments/notifications";
import { notificationCardClassName } from "@/lib/notifications/urgency";
import { cn } from "@/lib/utils";

type PaymentDashboardCardsProps = {
  counts: PaymentDashboardCounts;
  activeQueue: string;
  pendingCount?: number;
  /** Hide the three queue summary cards (e.g. on history views). */
  showQueueCards?: boolean;
  /** Hide pending alert when user is already on the pending approval tab. */
  hidePendingAlert?: boolean;
};

const CARD_CONFIG = [
  {
    key: "outstanding",
    label: "Outstanding",
    description: "Approved batches with no payments yet",
    href: "/payments?view=queue&filter=outstanding",
  },
  {
    key: "partial",
    label: "Partially paid",
    description: "Approved batches with part payment made",
    href: "/payments?view=queue&filter=partial",
  },
  {
    key: "completed",
    label: "Completed",
    description: "Approved batches fully paid",
    href: "/payments?view=queue&filter=completed",
  },
] as const;

export function PaymentDashboardCards({
  counts,
  activeQueue,
  pendingCount = 0,
  showQueueCards = true,
  hidePendingAlert = false,
}: PaymentDashboardCardsProps) {
  const showPendingAlert = pendingCount > 0 && !hidePendingAlert;

  if (!showQueueCards && !showPendingAlert) {
    return null;
  }

  return (
    <div className="space-y-4">
      {showQueueCards ? (
        <div className="payment-summary-grid">
          {CARD_CONFIG.map((card) => {
            const isActive = activeQueue === card.key;

            return (
              <Link
                key={card.key}
                href={card.href}
                className={cn(
                  "rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:bg-muted/20",
                  isActive
                    ? "border-primary/40 ring-1 ring-primary/20"
                    : "border-border/70",
                )}
              >
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  {counts[card.key].toLocaleString()}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {card.description}
                </p>
              </Link>
            );
          })}
        </div>
      ) : null}

      {showPendingAlert ? (
        <Link
          href="/payments?view=history&status=pending_approval"
          className={cn(
            "notification-strip-urgent block p-5",
            notificationCardClassName("urgent"),
          )}
        >
          <p className="notification-strip-urgent-title">
            {formatPaymentPendingDashboardStripTitle(pendingCount)}
          </p>
          <p className="notification-strip-urgent-subtitle mt-1">
            {formatPaymentPendingDashboardStripSubtitle()}
          </p>
        </Link>
      ) : null}
    </div>
  );
}
