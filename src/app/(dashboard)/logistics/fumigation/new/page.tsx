import { FumigationChamberForm } from "@/components/logistics/fumigation-chamber-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createFumigationChamber } from "@/lib/actions/fumigation-chambers";
import { requireLogisticsWrite } from "@/lib/auth/require-role";

export default async function NewFumigationPage() {
  await requireLogisticsWrite();

  return (
    <div className="space-y-6">
      <PageHeader title="Add fumigation facility" />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Facility details</CardTitle>
        </CardHeader>
        <CardContent>
          <FumigationChamberForm
            action={createFumigationChamber}
            redirectTo="/logistics?tab=fumigation&message=created"
          />
        </CardContent>
      </Card>
    </div>
  );
}
