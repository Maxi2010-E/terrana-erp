import { CustomerStatusBadge } from "@/components/logistics/customer-status-badge";
import { LogisticsEmptyState } from "@/components/logistics/logistics-empty-state";
import { Button } from "@/components/ui/button";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { TableViewAction } from "@/components/ui/table-view-action";
import {
  getCustomersList,
  toggleCustomerStatusForm,
} from "@/lib/actions/customers";
import {
  FUMIGATION_REQUIREMENT_LABELS,
  type CustomerStatus,
} from "@/lib/logistics/constants";
import { canWriteLogistics } from "@/lib/logistics/permissions";
import type { AppRole } from "@/lib/roles";
import { Users } from "lucide-react";

type CustomersPanelProps = {
  page: number;
  query: string;
  role: AppRole;
};

const HEAD_CELL =
  "px-4 pb-3 pt-1 text-left text-xs font-medium tracking-wide uppercase text-muted-foreground";
const BODY_CELL = "px-4 py-4 align-middle leading-normal";

export async function CustomersPanel({
  page,
  query,
  role,
}: CustomersPanelProps) {
  const canEdit = canWriteLogistics(role);
  const { rows, total } = await getCustomersList(page, query);

  if (total === 0 && !query) {
    return (
      <LogisticsEmptyState icon={Users} message="No customers recorded." />
    );
  }

  return (
    <div className="space-y-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border/60">
              <th className={HEAD_CELL}>Customer ID</th>
              <th className={HEAD_CELL}>Name</th>
              <th className={HEAD_CELL}>Country</th>
              <th className={HEAD_CELL}>Fumigation</th>
              <th className={HEAD_CELL}>Status</th>
              <th className={HEAD_CELL}>Phone</th>
              <th className={HEAD_CELL}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No customers match your search.
                </td>
              </tr>
            ) : (
              rows.map((customer) => {
                const isActive = customer.status === "active";
                return (
                  <tr
                    key={customer.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className={`${BODY_CELL} font-medium`}>
                      {customer.customer_code}
                    </td>
                    <td className={BODY_CELL}>{customer.customer_name}</td>
                    <td className={BODY_CELL}>{customer.country}</td>
                    <td className={BODY_CELL}>
                      {
                        FUMIGATION_REQUIREMENT_LABELS[
                          customer.fumigation_requirement
                        ]
                      }
                    </td>
                    <td className={BODY_CELL}>
                      <CustomerStatusBadge
                        status={customer.status as CustomerStatus}
                      />
                    </td>
                    <td className={BODY_CELL}>{customer.phone ?? "—"}</td>
                    <td className={BODY_CELL}>
                      <div className="flex flex-wrap gap-2">
                        <TableViewAction
                          href={`/logistics/customers/${customer.id}`}
                        />
                        {canEdit ? (
                          <form action={toggleCustomerStatusForm}>
                            <input
                              type="hidden"
                              name="customer_id"
                              value={customer.id}
                            />
                            <input
                              type="hidden"
                              name="next_status"
                              value={isActive ? "inactive" : "active"}
                            />
                            <Button type="submit" variant="outline" size="sm">
                              {isActive ? "Deactivate" : "Activate"}
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
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
            tab: "customers",
            q: query || undefined,
          }}
        />
      </div>
    </div>
  );
}
