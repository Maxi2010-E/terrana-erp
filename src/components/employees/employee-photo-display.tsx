import { cn } from "@/lib/utils";

type EmployeePhotoDisplayProps = {
  photoUrl: string | null;
  firstName: string;
  lastName: string;
  /** compact = list/inline, edit = upload panel, profile = employee detail view */
  variant?: "compact" | "edit" | "profile";
  className?: string;
};

function initials(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0).toUpperCase();
  const last = lastName.trim().charAt(0).toUpperCase();
  return `${first}${last}` || "?";
}

const variantClasses = {
  compact: "size-12 text-sm",
  edit: "size-24 text-xl sm:size-28 sm:text-2xl",
  profile: "size-28 text-2xl sm:size-32 md:size-36 md:text-3xl",
} as const;

export function EmployeePhotoDisplay({
  photoUrl,
  firstName,
  lastName,
  variant = "profile",
  className,
}: EmployeePhotoDisplayProps) {
  const frameClassName = cn(
    "aspect-square shrink-0 overflow-hidden rounded-full border border-border/80 bg-muted shadow-sm",
    variantClasses[variant],
    className,
  );

  if (photoUrl) {
    return (
      <div className={frameClassName}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={`${firstName} ${lastName}`}
          className="size-full object-cover object-center"
          decoding="async"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        frameClassName,
        "flex items-center justify-center font-semibold text-muted-foreground",
      )}
      aria-hidden
    >
      {initials(firstName, lastName)}
    </div>
  );
}
