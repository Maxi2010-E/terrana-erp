type AppHeaderProps = {
  displayName: string;
};

export function AppHeader({ displayName }: AppHeaderProps) {
  return (
    <header
      data-layout="dashboard-header"
      className="flex h-12 items-center justify-between gap-4 border-b border-border/70 bg-card/80 px-4 backdrop-blur-sm lg:px-8"
    >
      <p className="truncate text-sm font-medium text-muted-foreground">
        Terrana Africa Limited
      </p>
      <p className="truncate text-sm text-muted-foreground">
        {displayName ? (
          <>
            Welcome,{" "}
            <span className="font-medium text-foreground">{displayName}</span>
          </>
        ) : (
          "Welcome"
        )}
      </p>
    </header>
  );
}
