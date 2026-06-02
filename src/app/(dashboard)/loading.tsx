import { Card, CardContent, CardHeader } from "@/components/ui/card";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>

      <Card>
        <CardHeader className="gap-4 pb-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-8 w-full max-w-md" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
