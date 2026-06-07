import { notFound } from "next/navigation";

import { TruckAgentForm } from "@/components/logistics/truck-agent-form";
import { PageHeader } from "@/components/layout/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTruckAgentById, updateTruckAgent } from "@/lib/actions/truck-agents";
import { requireLogisticsRead } from "@/lib/auth/require-role";
import { canWriteLogistics } from "@/lib/logistics/permissions";

type TruckAgentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TruckAgentDetailPage({ params }: TruckAgentDetailPageProps) {
  const { role } = await requireLogisticsRead();
  const canEdit = canWriteLogistics(role);
  const { id } = await params;
  const agent = await getTruckAgentById(id);

  if (!agent) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={agent.agent_name}
        actions={
          <LinkButton variant="outline" href="/logistics?tab=truck-agents">
            Back to list
          </LinkButton>
        }
      />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Agent details</CardTitle>
        </CardHeader>
        <CardContent>
          {canEdit ? (
            <TruckAgentForm agent={agent} action={updateTruckAgent.bind(null, id)} />
          ) : (
            <dl className="grid gap-4 md:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Phone</dt>
                <dd>{agent.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Email</dt>
                <dd>{agent.email ?? "—"}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-xs uppercase text-muted-foreground">Address</dt>
                <dd>{agent.address ?? "—"}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
