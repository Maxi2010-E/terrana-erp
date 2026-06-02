import { Badge } from "@/components/ui/badge";
import {
  INVENTORY_STATUS_LABELS,
  type InventoryStatus,
} from "@/lib/inventory/constants";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<InventoryStatus, string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-800",
  reserved: "border-amber-200 bg-amber-50 text-amber-900",
  allocated: "border-sky-200 bg-sky-50 text-sky-900",
  shipped: "border-violet-200 bg-violet-50 text-violet-900",
};

export function InventoryStatusBadge({
  status,
  className,
}: {
  status: InventoryStatus;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(STATUS_STYLES[status], className)}>
      {INVENTORY_STATUS_LABELS[status]}
    </Badge>
  );
}
