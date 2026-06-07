import { Badge } from "@/components/ui/badge";
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/lib/payments/constants";

const METHOD_STYLES: Record<PaymentMethod, string> = {
  cash: "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100",
  transfer:
    "border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100",
};

export function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  return (
    <Badge variant="outline" className={METHOD_STYLES[method]}>
      {PAYMENT_METHOD_LABELS[method]}
    </Badge>
  );
}
