import { Badge } from "@/components/ui/badge";
import {
  PROCESSING_SESSION_STATUS_LABELS,
  type ProcessingSessionStatus,
} from "@/lib/processing/constants";
import { notificationColors } from "@/lib/notifications/urgency";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<
  ProcessingSessionStatus,
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
  in_progress: {
    className: "border-sky-200 bg-sky-50 text-sky-900",
  },
  completed: {
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  rejected: {
    className: "border-rose-200 bg-rose-50 text-rose-900",
  },
};

export function ProcessingStatusBadge({
  status,
  className,
}: {
  status: ProcessingSessionStatus;
  className?: string;
}) {
  const styles = STATUS_STYLES[status];

  return (
    <Badge
      variant="outline"
      className={cn(styles.className, className)}
      style={styles.style}
    >
      {PROCESSING_SESSION_STATUS_LABELS[status]}
    </Badge>
  );
}
