import { notFound } from "next/navigation";

import { FumigationChamberForm } from "@/components/logistics/fumigation-chamber-form";
import { PageHeader } from "@/components/layout/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getFumigationChamberById,
  updateFumigationChamber,
} from "@/lib/actions/fumigation-chambers";
import { requireLogisticsRead } from "@/lib/auth/require-role";
import { canWriteLogistics } from "@/lib/logistics/permissions";

type FumigationDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function FumigationDetailPage({ params }: FumigationDetailPageProps) {
  const { role } = await requireLogisticsRead();
  const canEdit = canWriteLogistics(role);
  const { id } = await params;
  const chamber = await getFumigationChamberById(id);

  if (!chamber) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={chamber.facility_name}
        actions={
          <LinkButton variant="outline" href="/logistics?tab=fumigation">
            Back to list
          </LinkButton>
        }
      />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Facility details</CardTitle>
        </CardHeader>
        <CardContent>
          {canEdit ? (
            <FumigationChamberForm
              chamber={chamber}
              action={updateFumigationChamber.bind(null, id)}
            />
          ) : (
            <dl className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <dt className="text-xs uppercase text-muted-foreground">Address</dt>
                <dd>{chamber.address ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Contact</dt>
                <dd>{chamber.contact_person ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Phone</dt>
                <dd>{chamber.phone ?? "—"}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-xs uppercase text-muted-foreground">Registration</dt>
                <dd>{chamber.registration_number ?? "—"}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
