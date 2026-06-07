import { Badge } from "@/components/ui/badge";
import {
  WASTE_TYPE_LABELS,
  type WasteType,
} from "@/lib/processing/constants";
import { cn } from "@/lib/utils";

const WASTE_TYPE_CLASSES: Record<WasteType, string> = {
  broken_flower:
    "border-amber-300/80 bg-amber-50 text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100",
  flower_bulb:
    "border-orange-300/80 bg-orange-50 text-orange-950 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-100",
  fungus:
    "border-rose-300/80 bg-rose-50 text-rose-950 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100",
  other:
    "border-slate-300/80 bg-slate-50 text-slate-800 dark:border-slate-500/40 dark:bg-slate-500/10 dark:text-slate-100",
};

export function WasteTypeBadge({
  wasteType,
  className,
}: {
  wasteType: WasteType;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-auto min-h-5 whitespace-normal px-2.5 py-0.5",
        WASTE_TYPE_CLASSES[wasteType],
        className,
      )}
    >
      {WASTE_TYPE_LABELS[wasteType]}
    </Badge>
  );
}
