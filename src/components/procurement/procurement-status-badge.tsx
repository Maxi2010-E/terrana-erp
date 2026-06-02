import { Badge } from "@/components/ui/badge";
import {
  PROCUREMENT_STATUS_LABELS,
  type ProcurementStatus,
} from "@/lib/procurement/constants";
import { notificationColors } from "@/lib/notifications/urgency";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<
  ProcurementStatus,
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
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
};

export function ProcurementStatusBadge({
  status,
  className,
}: {
  status: ProcurementStatus;
  className?: string;
}) {
  const styles = STATUS_STYLES[status];

  return (
    <Badge
      variant="outline"
      className={cn(styles.className, className)}
      style={styles.style}
    >
      {PROCUREMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
