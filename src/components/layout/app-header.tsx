import { ROLE_LABELS, type AppRole } from "@/lib/roles";
import { terranaColors } from "@/lib/theme";
import { Button } from "@/components/ui/button";

type AppHeaderProps = {
  email?: string;
  role: AppRole;
};

export function AppHeader({ email, role }: AppHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/80 bg-card px-4 shadow-sm lg:px-6">
      <div
        className="border-l-4 pl-3"
        style={{ borderColor: terranaColors.brand }}
      >
        <p className="text-sm font-semibold text-foreground">
          Terrana Africa Limited
        </p>
        <p className="text-xs text-muted-foreground">
          Hibiscus export operations
        </p>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div className="hidden text-right sm:block">
          <p className="font-medium">{email ?? "User"}</p>
          <p className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</p>
        </div>
        <form action="/auth/signout" method="post">
          <Button variant="outline" size="sm" type="submit">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
