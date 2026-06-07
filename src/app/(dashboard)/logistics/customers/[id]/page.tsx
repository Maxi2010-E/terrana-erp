import { notFound } from "next/navigation";

import { CustomerDetailTabs } from "@/components/logistics/customer-detail-tabs";
import { CustomerStatusBadge } from "@/components/logistics/customer-status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { LinkButton } from "@/components/ui/link-button";
import {
  getCustomerById,
  getShipmentsByCustomerId,
  updateCustomer,
} from "@/lib/actions/customers";
import { requireLogisticsRead } from "@/lib/auth/require-role";
import type { CustomerStatus } from "@/lib/logistics/constants";
import { canWriteLogistics } from "@/lib/logistics/permissions";
import type { Customer } from "@/lib/logistics/types";

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { role } = await requireLogisticsRead();
  const canEdit = canWriteLogistics(role);
  const { id } = await params;
  const [customer, shipments] = await Promise.all([
    getCustomerById(id),
    getShipmentsByCustomerId(id),
  ]);

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.customer_name}
        meta={`${customer.customer_code}${customer.country ? ` · ${customer.country}` : ""}`}
        actions={
          <LinkButton variant="outline" href="/logistics?tab=customers">
            Back to list
          </LinkButton>
        }
      />
      <CustomerStatusBadge status={customer.status as CustomerStatus} />
      <CustomerDetailTabs
        customer={customer as Customer}
        shipments={shipments}
        canEdit={canEdit}
        updateAction={updateCustomer}
      />
    </div>
  );
}
