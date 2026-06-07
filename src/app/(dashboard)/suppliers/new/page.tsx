import { SupplierCreateForm } from "@/components/suppliers/supplier-create-form";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupplier } from "@/lib/actions/suppliers";
import { requireSupplierAdmin } from "@/lib/auth/require-role";

export default async function NewSupplierPage() {
  await requireSupplierAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Add supplier</h1>
          <p className="text-sm text-muted-foreground">
            Create a supplier, then add bank accounts on the detail page.
          </p>
        </div>
        <LinkButton variant="outline" href="/suppliers">
          Back to list
        </LinkButton>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Supplier information</CardTitle>
        </CardHeader>
        <CardContent>
          <SupplierCreateForm action={createSupplier} />
        </CardContent>
      </Card>
    </div>
  );
}
