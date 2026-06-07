import { SupplierStatusBadge } from "@/components/suppliers/supplier-status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { SuccessFlash } from "@/components/layout/success-flash";
import { LinkButton } from "@/components/ui/link-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { TableViewAction } from "@/components/ui/table-view-action";
import {
  getSuppliersList,
  updateSupplierStatus,
} from "@/lib/actions/suppliers";
import { getSupplierProcurementCounts } from "@/lib/actions/procurement";
import { getSupplierOutstandingTotals } from "@/lib/actions/payments";
import { requireSupplierRead } from "@/lib/auth/require-role";
import { formatMoneyIfAllowed } from "@/lib/currency";
import { canAccessModule } from "@/lib/permissions/matrix";
import { canViewPaymentAmounts } from "@/lib/payments/permissions";
import type { SupplierStatus } from "@/lib/suppliers/constants";

type SuppliersPageProps = {
  searchParams: Promise<{ page?: string; q?: string; message?: string }>;
};

function successMessage(message: string | undefined): string | null {
  if (message === "created") {
    return "Supplier created successfully.";
  }
  if (message === "updated") {
    return "Supplier updated successfully.";
  }
  if (message === "bank_added") {
    return "Bank account added successfully.";
  }
  return null;
}

function recordLabel(total: number): string {
  if (total === 0) {
    return "No suppliers yet";
  }
  if (total === 1) {
    return "1 supplier";
  }
  return `${total.toLocaleString()} suppliers`;
}

const HEAD_CELL =
  "px-4 pb-3 pt-1 text-left text-xs font-medium tracking-wide uppercase";
const BODY_CELL = "px-4 py-4 align-middle leading-normal";

export default async function SuppliersPage({ searchParams }: SuppliersPageProps) {
  const { role } = await requireSupplierRead();
  const canEdit = role === "super_admin" || role === "admin";
  const showOutstanding = canAccessModule(role, "payments");
  const showPaymentAmounts = canViewPaymentAmounts(role);
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const query = params.q ?? "";
  const flash = successMessage(params.message);
  const { rows, total } = await getSuppliersList(page, query);
  const supplierIds = rows.map((supplier) => supplier.id);
  const [procurementCounts, outstandingTotals] = await Promise.all([
    getSupplierProcurementCounts(supplierIds),
    showOutstanding
      ? getSupplierOutstandingTotals(supplierIds)
      : Promise.resolve({} as Record<string, number>),
  ]);

  async function toggleSupplierStatus(formData: FormData) {
    "use server";
    const supplierId = String(formData.get("supplier_id") ?? "");
    const nextStatus = String(formData.get("next_status") ?? "");
    await updateSupplierStatus(supplierId, nextStatus);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Supplier master records — no deletes, status changes only."
        meta={recordLabel(total)}
        actions={
          canEdit ? (
            <LinkButton href="/suppliers/new">Add supplier</LinkButton>
          ) : null
        }
      />

      {flash ? <SuccessFlash message={flash} /> : null}

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="gap-4 border-b border-border/60 pb-4">
          <form className="flex max-w-md gap-2" method="get">
            <input
              name="q"
              defaultValue={query}
              placeholder="Search by name, ID, phone…"
              className="flex h-10 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
        </CardHeader>
        <CardContent className="space-y-5 px-4 pb-6 pt-5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground">
                  <th className={HEAD_CELL}>Supplier ID</th>
                  <th className={HEAD_CELL}>Name</th>
                  <th className={HEAD_CELL}>Status</th>
                  <th className={HEAD_CELL}>Phone</th>
                  <th className={HEAD_CELL}>Procurements</th>
                  <th className={HEAD_CELL}>Outstanding</th>
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
                      No suppliers found.
                    </td>
                  </tr>
                ) : (
                  rows.map((supplier) => {
                    const isActive = supplier.status === "active";

                    return (
                      <tr
                        key={supplier.id}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className={`${BODY_CELL} font-medium`}>
                          {supplier.supplier_code}
                        </td>
                        <td className={BODY_CELL}>{supplier.supplier_name}</td>
                        <td className={BODY_CELL}>
                          <SupplierStatusBadge
                            status={supplier.status as SupplierStatus}
                          />
                        </td>
                        <td className={BODY_CELL}>{supplier.phone ?? "—"}</td>
                        <td className={BODY_CELL}>
                          {procurementCounts[supplier.id] ?? 0}
                        </td>
                        <td className={BODY_CELL}>
                          {formatMoneyIfAllowed(
                            outstandingTotals[supplier.id] ?? null,
                            showPaymentAmounts,
                          )}
                        </td>
                        <td className={BODY_CELL}>
                          <div className="flex flex-wrap gap-2">
                            <TableViewAction href={`/suppliers/${supplier.id}`} />
                            {canEdit ? (
                              <form action={toggleSupplierStatus}>
                                <input
                                  type="hidden"
                                  name="supplier_id"
                                  value={supplier.id}
                                />
                                <input
                                  type="hidden"
                                  name="next_status"
                                  value={isActive ? "inactive" : "active"}
                                />
                                <Button
                                  type="submit"
                                  variant="outline"
                                  size="sm"
                                >
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

          <PaginationBar
            page={page}
            total={total}
            pathname="/suppliers"
            query={{ q: query || undefined }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
