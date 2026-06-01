import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const KPI_CARDS = [
  {
    title: "Procurement KG",
    value: "—",
    note: "Phase 9 dashboard",
    accent: "border-l-chart-1",
  },
  {
    title: "Current Inventory",
    value: "—",
    note: "Phase 5 inventory",
    accent: "border-l-chart-2",
  },
  {
    title: "Outstanding Payments",
    value: "—",
    note: "Phase 6 payments",
    accent: "border-l-chart-3",
  },
  {
    title: "Containers In Transit",
    value: "—",
    note: "Phase 8 logistics",
    accent: "border-l-chart-4",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          CEO Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Phase 0 shell — KPIs activate in Phase 9 after operational modules
          are live.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_CARDS.map((card) => (
          <Card
            key={card.title}
            className={cn("border-l-4 shadow-sm", card.accent)}
          >
            <CardHeader className="pb-2">
              <CardDescription>{card.title}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {card.value}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{card.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Phase 0 complete when you can:</CardTitle>
          <CardDescription>Quick test checklist</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Sign in with your Supabase user</p>
          <p>2. See this dashboard and the left sidebar</p>
          <p>3. Open any module — placeholder page appears</p>
          <p>4. Sign out and confirm you return to login</p>
        </CardContent>
      </Card>
    </div>
  );
}
