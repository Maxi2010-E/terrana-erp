import Link from "next/link";
import { ChevronRight } from "lucide-react";

import type { SettingsOption } from "@/lib/settings/options";

export function SettingsOptionLink({
  href,
  title,
  description,
}: SettingsOption) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-sm transition-colors hover:border-border hover:bg-muted/30"
    >
      <div className="min-w-0 space-y-1">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ChevronRight
        className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}
