import { TruckAgentForm } from "@/components/logistics/truck-agent-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createTruckAgent } from "@/lib/actions/truck-agents";
import { requireLogisticsWrite } from "@/lib/auth/require-role";

export default async function NewTruckAgentPage() {
  await requireLogisticsWrite();

  return (
    <div className="space-y-6">
      <PageHeader title="Add truck agent" />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Agent details</CardTitle>
        </CardHeader>
        <CardContent>
          <TruckAgentForm
            action={createTruckAgent}
            redirectTo="/logistics?tab=truck-agents&message=created"
          />
        </CardContent>
      </Card>
    </div>
  );
}
