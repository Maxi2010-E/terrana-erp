import { Badge } from "@/components/ui/badge";
import {
  EMPLOYEE_STATUS_LABELS,
  type EmployeeStatus,
} from "@/lib/employees/constants";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<EmployeeStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  inactive: "border-zinc-200 bg-zinc-100 text-zinc-700",
  on_leave: "border-amber-200 bg-amber-50 text-amber-800",
  archived: "border-slate-200 bg-slate-100 text-slate-700",
};

export function EmployeeStatusBadge({
  status,
  className,
}: {
  status: EmployeeStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(STATUS_STYLES[status], className)}
    >
      {EMPLOYEE_STATUS_LABELS[status]}
    </Badge>
  );
}

export function UserStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const isActive = status === "active";

  return (
    <Badge
      variant="outline"
      className={cn(
        isActive
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-zinc-200 bg-zinc-100 text-zinc-700",
        className,
      )}
    >
      {isActive ? "Active" : "Disabled"}
    </Badge>
  );
}
