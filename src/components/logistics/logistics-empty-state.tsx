import type { LucideIcon } from "lucide-react";

export function LogisticsEmptyState({
  icon: Icon,
  message,
}: {
  icon: LucideIcon;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <Icon className="size-10 text-muted-foreground/40" strokeWidth={1.25} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
