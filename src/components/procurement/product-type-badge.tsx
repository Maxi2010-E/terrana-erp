import { Badge } from "@/components/ui/badge";
import { getProductTypeStyle } from "@/lib/procurement/product-type-styles";
import { cn } from "@/lib/utils";

export function ProductTypeBadge({
  productType,
  className,
}: {
  productType: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-auto min-h-5 px-2.5 py-0.5 whitespace-normal",
        getProductTypeStyle(productType),
        className,
      )}
    >
      {productType}
    </Badge>
  );
}
