import { Badge } from "@/components/ui/badge";
import {
  PAYMENT_RECORD_STATUS_LABELS,
  type PaymentRecordStatus,
} from "@/lib/payments/constants";
import { notificationColors } from "@/lib/notifications/urgency";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<
  PaymentRecordStatus,
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
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
  },
};

export function PaymentRecordStatusBadge({
  status,
  className,
}: {
  status: PaymentRecordStatus;
  className?: string;
}) {
  const styles = STATUS_STYLES[status];

  return (
    <Badge variant="outline" className={cn(styles.className, className)} style={styles.style}>
      {PAYMENT_RECORD_STATUS_LABELS[status]}
    </Badge>
  );
}
