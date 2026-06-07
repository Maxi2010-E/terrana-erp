import { LogisticsEmptyState } from "@/components/logistics/logistics-empty-state";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { TableViewAction } from "@/components/ui/table-view-action";
import { getFumigationChambersList } from "@/lib/actions/fumigation-chambers";
import { Factory } from "lucide-react";

type FumigationPanelProps = {
  page: number;
  query: string;
};

const HEAD_CELL =
  "px-4 pb-3 pt-1 text-left text-xs font-medium tracking-wide uppercase text-muted-foreground";
const BODY_CELL = "px-4 py-4 align-middle leading-normal";

export async function FumigationPanel({ page, query }: FumigationPanelProps) {
  const { rows, total } = await getFumigationChambersList(page, query);

  if (total === 0 && !query) {
    return (
      <LogisticsEmptyState
        icon={Factory}
        message="No fumigation facilities recorded."
      />
    );
  }

  return (
    <div className="space-y-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border/60">
              <th className={HEAD_CELL}>Facility</th>
              <th className={HEAD_CELL}>Contact</th>
              <th className={HEAD_CELL}>Phone</th>
              <th className={HEAD_CELL}>Registration</th>
              <th className={HEAD_CELL}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No facilities match your search.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className={`${BODY_CELL} font-medium`}>
                    {row.facility_name}
                  </td>
                  <td className={BODY_CELL}>{row.contact_person ?? "—"}</td>
                  <td className={BODY_CELL}>{row.phone ?? "—"}</td>
                  <td className={BODY_CELL}>
                    {row.registration_number ?? "—"}
                  </td>
                  <td className={BODY_CELL}>
                    <TableViewAction
                      href={`/logistics/fumigation/${row.id}`}
                    />
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
            tab: "fumigation",
            q: query || undefined,
          }}
        />
      </div>
    </div>
  );
}
