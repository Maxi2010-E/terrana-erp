export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading page">
      <div className="space-y-2">
        <div className="h-8 w-40 rounded-lg bg-muted" />
        <div className="h-4 w-72 max-w-full rounded bg-muted/80" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-28 rounded-2xl bg-muted/70" />
        <div className="h-28 rounded-2xl bg-muted/70" />
        <div className="h-28 rounded-2xl bg-muted/70" />
      </div>
      <div className="h-72 rounded-2xl bg-muted/60" />
    </div>
  );
}
