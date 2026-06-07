import { CustomerCreateForm } from "@/components/logistics/customer-create-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createCustomer } from "@/lib/actions/customers";
import { requireLogisticsWrite } from "@/lib/auth/require-role";

export default async function NewCustomerPage() {
  await requireLogisticsWrite();

  return (
    <div className="space-y-6">
      <PageHeader title="Add customer" description="Create a new export customer record." />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Customer details</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerCreateForm action={createCustomer} />
        </CardContent>
      </Card>
    </div>
  );
}
