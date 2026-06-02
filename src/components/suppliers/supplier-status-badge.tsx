import { Badge } from "@/components/ui/badge";
import {
  SUPPLIER_STATUS_LABELS,
  type SupplierStatus,
} from "@/lib/suppliers/constants";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<SupplierStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  inactive: "border-zinc-200 bg-zinc-100 text-zinc-700",
};

export function SupplierStatusBadge({
  status,
  className,
}: {
  status: SupplierStatus;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(STATUS_STYLES[status], className)}>
      {SUPPLIER_STATUS_LABELS[status]}
    </Badge>
  );
}
