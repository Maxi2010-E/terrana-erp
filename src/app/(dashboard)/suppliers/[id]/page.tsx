import { notFound } from "next/navigation";

import { SupplierDetailTabs } from "@/components/suppliers/supplier-detail-tabs";
import { SupplierStatusBadge } from "@/components/suppliers/supplier-status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { LinkButton } from "@/components/ui/link-button";
import {
  addBankAccount,
  deleteBankAccount,
  getSupplierById,
  setPrimaryBankAccount,
  updateSupplier,
} from "@/lib/actions/suppliers";
import { getProcurementsBySupplierId } from "@/lib/actions/procurement";
import { getPaymentsForSupplier } from "@/lib/actions/payments";
import { canViewProcurementPricing } from "@/lib/procurement/permissions";
import { canApprovePayment } from "@/lib/payments/permissions";
import { requireSupplierRead } from "@/lib/auth/require-role";
import { canAccessModule } from "@/lib/permissions/matrix";
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
  const canApprovePayments = canApprovePayment(role);
  const showProcurementPricing = canViewProcurementPricing(role);
  const showPaymentsTab = canAccessModule(role, "payments");
  const { id } = await params;
  const [{ supplier, bankAccounts }, procurements, payments] = await Promise.all([
    getSupplierById(id),
    getProcurementsBySupplierId(id),
    showPaymentsTab ? getPaymentsForSupplier(id) : Promise.resolve([]),
  ]);

  if (!supplier) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={supplier.supplier_name}
        meta={`${supplier.supplier_code}${supplier.phone ? ` · ${supplier.phone}` : ""}`}
        actions={
          <LinkButton variant="outline" href="/suppliers">
            Back to list
          </LinkButton>
        }
      />

      <SupplierStatusBadge status={supplier.status as SupplierStatus} />

      <SupplierDetailTabs
        supplier={supplier as Supplier}
        bankAccounts={bankAccounts}
        procurements={procurements}
        payments={payments}
        showProcurementPricing={showProcurementPricing}
        canEdit={canEdit}
        canApprovePayments={canApprovePayments}
        showPaymentsTab={showPaymentsTab}
        updateAction={updateSupplier}
        addBankAction={addBankAccount}
        deleteBankAction={deleteBankAccount}
        setPrimaryBankAction={setPrimaryBankAccount}
      />
    </div>
  );
}
