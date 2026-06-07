import { CostAllocationTableClient } from "@/components/logistics/panels/cost-allocation-table-client";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { getCostAllocationList } from "@/lib/actions/shipments";

type CostAllocationPanelProps = {
  page: number;
  query: string;
};

export async function CostAllocationPanel({
  page,
  query,
}: CostAllocationPanelProps) {
  const { rows, total } = await getCostAllocationList(page, query);

  return (
    <div className="space-y-0">
      <CostAllocationTableClient rows={rows} query={query} />
      {total > 0 ? (
        <div className="border-t border-border/60 px-4 py-4">
          <PaginationBar
            page={page}
            total={total}
            pathname="/logistics"
            query={{
              tab: "cost-allocation",
              q: query || undefined,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
