import Link from "next/link";

import { OperationalExpenseSummaryGrid } from "@/components/expenses/operational-expense-summary-grid";
import type { OperationalExpenseType } from "@/lib/expenses/constants";
import {
  OPERATIONAL_EXPENSE_DASHBOARD_CARDS,
  getOperationalAwaitingRecordCount,
} from "@/lib/expenses/operational-queue";
import {
  formatOperationalExpensePendingStripSubtitle,
  formatOperationalExpensePendingStripTitle,
  formatOperationalExpenseSubmittedPendingStripTitle,
  getOperationalPendingApprovalCount,
  operationalExpensesAwaitingRecordTotal,
  type OperationalExpenseNotificationCounts,
} from "@/lib/expenses/notifications";
import {
  notificationBadgeClassName,
  notificationBadgeStyle,
  notificationCardClassName,
} from "@/lib/notifications/urgency";
import { cn } from "@/lib/utils";

type OperationalExpenseDashboardCardsProps = {
  counts: OperationalExpenseNotificationCounts;
  canRecord: boolean;
  canApprove: boolean;
  activeType?: OperationalExpenseType;
  hidePendingStrip?: boolean;
};

function OperationalExpenseSummaryCard({
  card,
  recordCount,
  pendingApprovalCount,
  isActive,
}: {
  card: (typeof OPERATIONAL_EXPENSE_DASHBOARD_CARDS)[number];
  recordCount: number | null;
  pendingApprovalCount: number;
  isActive: boolean;
}) {
  const hasRecordAction = recordCount !== null && recordCount > 0;
  const recordDisplay =
    recordCount === null ? "—" : recordCount.toLocaleString();

  const className = cn(
    "relative flex min-h-[7.25rem] min-w-0 flex-1 basis-0 flex-col rounded-xl border bg-card p-3 shadow-sm transition-colors",
    card.disabled
      ? "cursor-not-allowed border-border/50 opacity-60"
      : hasRecordAction
        ? "border-amber-500/35 hover:bg-amber-500/[0.04]"
        : pendingApprovalCount > 0
          ? "border-red-500/25 hover:bg-red-500/[0.03]"
          : "border-border/70 hover:bg-muted/20",
    isActive && !card.disabled && "ring-1 ring-amber-500/30",
  );

  const countsRow = (
    <div className="mt-1.5 flex items-end gap-2">
      <span
        className={cn(
          "text-2xl font-semibold leading-none tracking-tight tabular-nums",
          hasRecordAction ? "text-amber-800 dark:text-amber-200" : "text-muted-foreground",
        )}
        title={
          recordCount === null
            ? "No automatic queue"
            : `${recordDisplay} to record`
        }
      >
        {recordDisplay}
      </span>
      {pendingApprovalCount > 0 ? (
        <span
          className={cn(notificationBadgeClassName(), "mb-0.5")}
          style={notificationBadgeStyle("urgent", false)}
          title={`${pendingApprovalCount.toLocaleString()} awaiting approval`}
        >
          {pendingApprovalCount > 99 ? "99+" : pendingApprovalCount}
        </span>
      ) : null}
    </div>
  );

  const body = (
    <>
      <p className="truncate text-xs font-medium text-foreground">{card.label}</p>
      {countsRow}
      <p className="mt-auto line-clamp-2 pt-2 text-[11px] leading-snug text-muted-foreground">
        {card.disabled
          ? card.disabledReason
          : pendingApprovalCount > 0 && hasRecordAction
            ? `${recordDisplay} to record · ${pendingApprovalCount} pending approval`
            : pendingApprovalCount > 0
              ? `${pendingApprovalCount} pending approval`
              : card.description}
      </p>
    </>
  );

  if (card.disabled || !card.href) {
    return <div className={className}>{body}</div>;
  }

  return (
    <Link href={card.href} prefetch={false} className={className}>
      {body}
    </Link>
  );
}

export function OperationalExpenseDashboardCards({
  counts,
  canRecord,
  canApprove,
  activeType,
  hidePendingStrip = false,
}: OperationalExpenseDashboardCardsProps) {
  const pendingCount = canApprove
    ? counts.pendingApproval
    : counts.submittedPending;

  const showPendingStrip = pendingCount > 0 && !hidePendingStrip;
  const totalToRecord = operationalExpensesAwaitingRecordTotal(counts);

  if (!canRecord && !showPendingStrip) {
    return null;
  }

  return (
    <div className="space-y-4">
      {canRecord ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-sm font-medium text-foreground">
                Operational costs
              </h2>
              <p className="text-sm text-muted-foreground">
                Large number = to record (amber). Red badge = awaiting approval.
                {totalToRecord > 0
                  ? ` ${totalToRecord.toLocaleString()} linked cost${totalToRecord === 1 ? "" : "s"} ready to record.`
                  : " All linked costs are recorded."}
              </p>
            </div>
          </div>

          <OperationalExpenseSummaryGrid>
            {OPERATIONAL_EXPENSE_DASHBOARD_CARDS.map((card) => {
              const recordCount = card.hasQueue
                ? getOperationalAwaitingRecordCount(counts, card.type)
                : null;
              const pendingApprovalCount = getOperationalPendingApprovalCount(
                counts,
                card.type,
              );

              return (
                <OperationalExpenseSummaryCard
                  key={card.type}
                  card={card}
                  recordCount={recordCount}
                  pendingApprovalCount={pendingApprovalCount}
                  isActive={activeType === card.type}
                />
              );
            })}
          </OperationalExpenseSummaryGrid>
        </div>
      ) : null}

      {showPendingStrip ? (
        <Link
          href="/expenses?tab=operational&status=pending_approval"
          prefetch={false}
          className={cn(
            "notification-strip-urgent block rounded-2xl p-5",
            notificationCardClassName("urgent"),
          )}
        >
          <p className="notification-strip-urgent-title">
            {canApprove
              ? formatOperationalExpensePendingStripTitle(pendingCount)
              : formatOperationalExpenseSubmittedPendingStripTitle(pendingCount)}
          </p>
          <p className="notification-strip-urgent-subtitle mt-1">
            {formatOperationalExpensePendingStripSubtitle()}
          </p>
        </Link>
      ) : null}
    </div>
  );
}
