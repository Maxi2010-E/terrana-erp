import { notFound } from "next/navigation";

import { SupplierDetailTabs } from "@/components/suppliers/supplier-detail-tabs";
import { SupplierStatusBadge } from "@/components/suppliers/supplier-status-badge";
import { LinkButton } from "@/components/ui/link-button";
import {
  addBankAccount,
  deleteBankAccount,
  getSupplierById,
  setPrimaryBankAccount,
  updateSupplier,
} from "@/lib/actions/suppliers";
import { getProcurementsBySupplierId } from "@/lib/actions/procurement";
import { canViewProcurementPricing } from "@/lib/procurement/permissions";
import { requireSupplierRead } from "@/lib/auth/require-role";
import type { SupplierStatus } from "@/lib/suppliers/constants";
import type { Supplier } from "@/lib/suppliers/types";

type SupplierDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SupplierDetailPage({
  params,
}: SupplierDetailPageProps) {
  const { role } = await requireSupplierRead();
  const canEdit = role === "super_admin" || role === "admin";
  const showProcurementPricing = canViewProcurementPricing(role);
  const { id } = await params;
  const [{ supplier, bankAccounts }, procurements] = await Promise.all([
    getSupplierById(id),
    getProcurementsBySupplierId(id),
  ]);

  if (!supplier) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {supplier.supplier_name}
            </h1>
            <SupplierStatusBadge
              status={supplier.status as SupplierStatus}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {supplier.supplier_code}
            {supplier.phone ? ` · ${supplier.phone}` : ""}
          </p>
        </div>
        <LinkButton variant="outline" href="/suppliers">
          Back to list
        </LinkButton>
      </div>

      <SupplierDetailTabs
        supplier={supplier as Supplier}
        bankAccounts={bankAccounts}
        procurements={procurements}
        showProcurementPricing={showProcurementPricing}
        canEdit={canEdit}
        updateAction={updateSupplier}
        addBankAction={addBankAccount}
        deleteBankAction={deleteBankAccount}
        setPrimaryBankAction={setPrimaryBankAccount}
      />
    </div>
  );
}
