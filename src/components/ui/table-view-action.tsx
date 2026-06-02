import Link from "next/link";

import { Badge } from "@/components/ui/badge";

type TableViewActionProps = {
  href: string;
  label?: string;
};

export function TableViewAction({
  href,
  label = "View",
}: TableViewActionProps) {
  return (
    <Badge
      variant="outline"
      className="border-border bg-background text-foreground hover:bg-muted"
      render={<Link href={href} />}
    >
      {label}
    </Badge>
  );
}
