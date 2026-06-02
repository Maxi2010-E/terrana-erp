import Link from "next/link";

import { SupplierStatusBadge } from "@/components/suppliers/supplier-status-badge";
import { LinkButton } from "@/components/ui/link-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  getSuppliersList,
  updateSupplierStatus,
} from "@/lib/actions/suppliers";
import { getSupplierProcurementCounts } from "@/lib/actions/procurement";
import { requireSupplierRead } from "@/lib/auth/require-role";
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

export default async function SuppliersPage({ searchParams }: SuppliersPageProps) {
  const { role } = await requireSupplierRead();
  const canEdit = role === "super_admin" || role === "admin";
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const query = params.q ?? "";
  const flash = successMessage(params.message);
  const { rows, total } = await getSuppliersList(page, query);
  const procurementCounts = await getSupplierProcurementCounts(
    rows.map((supplier) => supplier.id),
  );

  async function toggleSupplierStatus(formData: FormData) {
    "use server";
    const supplierId = String(formData.get("supplier_id") ?? "");
    const nextStatus = String(formData.get("next_status") ?? "");
    await updateSupplierStatus(supplierId, nextStatus);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground">
            Supplier master records — no deletes, status changes only.
          </p>
        </div>
        {canEdit ? (
          <LinkButton href="/suppliers/new">Add supplier</LinkButton>
        ) : null}
      </div>

      {flash ? (
        <p
          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200"
          role="status"
        >
          {flash}
        </p>
      ) : null}

      <Card>
        <CardHeader className="gap-4 pb-4">
          <CardTitle className="text-base">Supplier list</CardTitle>
          <form className="flex max-w-md gap-2" method="get">
            <input
              name="q"
              defaultValue={query}
              placeholder="Search by name, ID, phone…"
              className="flex h-8 flex-1 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button type="submit" variant="outline" size="sm">
              Search
            </Button>
          </form>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Supplier ID</th>
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Phone</th>
                  <th className="pb-3 pr-4 font-medium">Procurements</th>
                  <th className="pb-3 pr-4 font-medium">Outstanding</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No suppliers found.
                    </td>
                  </tr>
                ) : (
                  rows.map((supplier) => {
                    const isActive = supplier.status === "active";

                    return (
                      <tr key={supplier.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">
                          {supplier.supplier_code}
                        </td>
                        <td className="py-3 pr-4">{supplier.supplier_name}</td>
                        <td className="py-3 pr-4">
                          <SupplierStatusBadge
                            status={supplier.status as SupplierStatus}
                          />
                        </td>
                        <td className="py-3 pr-4">{supplier.phone ?? "—"}</td>
                        <td className="py-3 pr-4">
                          {procurementCounts[supplier.id] ?? 0}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">—</td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/suppliers/${supplier.id}`}
                              className="inline-flex h-7 items-center rounded-lg border border-border bg-background px-2.5 text-xs font-medium hover:bg-muted"
                            >
                              View
                            </Link>
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
