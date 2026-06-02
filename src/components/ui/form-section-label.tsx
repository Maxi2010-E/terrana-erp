import { cn } from "@/lib/utils";

export function FormSectionLabel({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-[11px] font-semibold tracking-wider text-muted-foreground uppercase",
        className,
      )}
      {...props}
    />
  );
}
