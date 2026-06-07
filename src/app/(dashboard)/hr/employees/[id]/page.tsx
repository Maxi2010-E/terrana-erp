import { notFound } from "next/navigation";

import { EmployeeDocumentsDisplay } from "@/components/employees/employee-documents-display";
import { EmployeeOverviewDisplay } from "@/components/employees/employee-overview-display";
import { EmployeePhotoPreview } from "@/components/employees/employee-photo-preview";
import { EmployeeStatusBadge } from "@/components/employees/status-badge";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getEmployeeById,
  getEmployeeDocumentSignedUrls,
  getEmployeePhotoSignedUrl,
} from "@/lib/actions/employees";
import { requireHrAdmin } from "@/lib/auth/require-role";
import type { Employee } from "@/lib/employees/types";

type EmployeeDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EmployeeDetailPage({
  params,
}: EmployeeDetailPageProps) {
  await requireHrAdmin();
  const { id } = await params;
  const employee = await getEmployeeById(id);

  if (!employee) {
    notFound();
  }

  const fullName = `${employee.first_name} ${employee.last_name}`;
  const [photoUrl, documentUrls] = await Promise.all([
    getEmployeePhotoSignedUrl(employee.photo_url),
    getEmployeeDocumentSignedUrls(employee),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <EmployeePhotoPreview
            employeeId={id}
            photoUrl={photoUrl}
            firstName={employee.first_name}
            lastName={employee.last_name}
            variant="edit"
          />
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{fullName}</h1>
            <p className="text-sm text-muted-foreground">
              {employee.employee_code} · {employee.job_title}
            </p>
            <EmployeeStatusBadge status={employee.status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href={`/hr/employees/${id}/edit`}>Edit details</LinkButton>
          <LinkButton variant="outline" href="/hr?tab=employees">
            Back to list
          </LinkButton>
        </div>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="space-y-5 pt-6">
          <EmployeeOverviewDisplay employee={employee as Employee} />

          <div className="space-y-2 border-t pt-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Staff documents
            </h2>
            <EmployeeDocumentsDisplay
              employeeId={id}
              employee={employee as Employee}
              signedUrls={documentUrls}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
