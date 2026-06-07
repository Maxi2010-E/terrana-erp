import { Badge } from "@/components/ui/badge";
import {
  SHIPMENT_STATUS_LABELS,
  type ShipmentStatus,
} from "@/lib/logistics/constants";
import { cn } from "@/lib/utils";

const STATUS_CLASS: Record<ShipmentStatus, string> = {
  loaded: "bg-amber-500/15 text-amber-900 dark:text-amber-200",
  in_transit: "bg-blue-500/15 text-blue-900 dark:text-blue-200",
  delivered: "bg-emerald-500/15 text-emerald-900 dark:text-emerald-200",
};

export function ShipmentStatusBadge({ status }: { status: ShipmentStatus }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", STATUS_CLASS[status])}>
      {SHIPMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
