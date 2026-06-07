import { Badge } from "@/components/ui/badge";
import {
  CUSTOMER_STATUS_LABELS,
  type CustomerStatus,
} from "@/lib/logistics/constants";

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  return (
    <Badge variant={status === "active" ? "default" : "secondary"}>
      {CUSTOMER_STATUS_LABELS[status]}
    </Badge>
  );
}
