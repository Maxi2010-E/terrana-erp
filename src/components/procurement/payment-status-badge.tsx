import { Badge } from "@/components/ui/badge";
import {
  PAYMENT_STATUS_LABELS,
  type PaymentStatus,
} from "@/lib/procurement/constants";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<PaymentStatus, string> = {
  unpaid: "border-zinc-200 bg-zinc-100 text-zinc-700",
  partially_paid: "border-sky-200 bg-sky-50 text-sky-900",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

export function PaymentStatusBadge({
  status,
  className,
}: {
  status: PaymentStatus;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(STATUS_STYLES[status], className)}>
      {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
