import { Badge } from "@/components/ui/badge";
import {
  EXPENSE_RECORD_STATUS_LABELS,
  type ExpenseRecordStatus,
} from "@/lib/expenses/constants";
import { notificationColors } from "@/lib/notifications/urgency";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<
  ExpenseRecordStatus,
  { className: string; style?: React.CSSProperties }
> = {
  pending_approval: {
    className: "border-transparent",
    style: {
      backgroundColor: `${notificationColors.urgent.background}18`,
      borderColor: `${notificationColors.urgent.background}55`,
      color: notificationColors.urgent.background,
    },
  },
  approved: {
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
  },
  payment_made: {
    className: "border-border/60 bg-muted/50 text-muted-foreground",
  },
};

export function ExpenseRecordStatusBadge({
  status,
  className,
}: {
  status: ExpenseRecordStatus;
  className?: string;
}) {
  const styles = STATUS_STYLES[status];

  return (
    <Badge
      variant="outline"
      className={cn(styles.className, className)}
      style={styles.style}
    >
      {EXPENSE_RECORD_STATUS_LABELS[status]}
    </Badge>
  );
}
