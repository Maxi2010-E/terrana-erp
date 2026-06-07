import { LogisticsEmptyState } from "@/components/logistics/logistics-empty-state";
import { TableViewAction } from "@/components/ui/table-view-action";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { getTruckAgentsList } from "@/lib/actions/truck-agents";
import { Truck } from "lucide-react";

type TruckAgentsPanelProps = {
  page: number;
  query: string;
};

const HEAD_CELL =
  "px-4 pb-3 pt-1 text-left text-xs font-medium tracking-wide uppercase text-muted-foreground";
const BODY_CELL = "px-4 py-4 align-middle leading-normal";

export async function TruckAgentsPanel({ page, query }: TruckAgentsPanelProps) {
  const { rows, total } = await getTruckAgentsList(page, query);

  if (total === 0 && !query) {
    return (
      <LogisticsEmptyState icon={Truck} message="No truck agents recorded." />
    );
  }

  return (
    <div className="space-y-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border/60">
              <th className={HEAD_CELL}>Agent</th>
              <th className={HEAD_CELL}>Phone</th>
              <th className={HEAD_CELL}>Email</th>
              <th className={HEAD_CELL}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No truck agents match your search.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className={`${BODY_CELL} font-medium`}>{row.agent_name}</td>
                  <td className={BODY_CELL}>{row.phone ?? "—"}</td>
                  <td className={BODY_CELL}>{row.email ?? "—"}</td>
                  <td className={BODY_CELL}>
                    <TableViewAction href={`/logistics/truck-agents/${row.id}`} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border/60 px-4 py-4">
        <PaginationBar
          page={page}
          total={total}
          pathname="/logistics"
          query={{
            tab: "truck-agents",
            q: query || undefined,
          }}
        />
      </div>
    </div>
  );
}
