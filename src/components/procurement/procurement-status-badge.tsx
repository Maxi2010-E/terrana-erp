import { Badge } from "@/components/ui/badge";
import {
  PROCUREMENT_STATUS_LABELS,
  type ProcurementStatus,
} from "@/lib/procurement/constants";
import { procurementStatusUrgencyForViewer } from "@/lib/procurement/approval-urgency";
import {
  notificationColors,
  type NotificationUrgency,
} from "@/lib/notifications/urgency";
import type { AppRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

const NEUTRAL_STYLES: Record<
  Extract<ProcurementStatus, "approved" | "rejected">,
  string
> = {
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-rose-200 bg-rose-50 text-rose-900",
};

function urgencyStyles(urgency: NotificationUrgency): React.CSSProperties {
  const colors = notificationColors[urgency];
  return {
    backgroundColor: `${colors.background}18`,
    borderColor: `${colors.background}55`,
    color: colors.background,
  };
}

export function ProcurementStatusBadge({
  status,
  viewerRole,
  className,
}: {
  status: ProcurementStatus;
  viewerRole?: AppRole;
  className?: string;
}) {
  const urgency = viewerRole
    ? procurementStatusUrgencyForViewer(status, viewerRole)
    : status === "pending_approval" ||
        status === "pending_second_approval" ||
        status === "pending_admin_approval"
      ? ("urgent" as const)
      : null;

  if (status === "approved" || status === "rejected") {
    return (
      <Badge
        variant="outline"
        className={cn(NEUTRAL_STYLES[status], className)}
      >
        {PROCUREMENT_STATUS_LABELS[status]}
      </Badge>
    );
  }

  if (!urgency) {
    return (
      <Badge variant="outline" className={className}>
        {PROCUREMENT_STATUS_LABELS[status]}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn("border-transparent", className)}
      style={urgencyStyles(urgency)}
    >
      {PROCUREMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
