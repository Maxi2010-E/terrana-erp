import { notFound } from "next/navigation";

import { EmployeeDocumentsPanel } from "@/components/employees/employee-documents-panel";
import { EmployeeForm } from "@/components/employees/employee-form";
import { EmployeePhotoUpload } from "@/components/employees/employee-photo-upload";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getEmployeeById,
  getEmployeeDocumentSignedUrls,
  getEmployeePhotoSignedUrl,
  removeEmployeePhoto,
  updateEmployee,
  uploadEmployeePhoto,
} from "@/lib/actions/employees";
import { requireHrAdmin } from "@/lib/auth/require-role";
import type { Employee } from "@/lib/employees/types";

type EditEmployeePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditEmployeePage({ params }: EditEmployeePageProps) {
  await requireHrAdmin();
  const { id } = await params;
  const employee = await getEmployeeById(id);

  if (!employee) {
    notFound();
  }

  const boundAction = updateEmployee.bind(null, id);
  const boundUploadAction = uploadEmployeePhoto.bind(null, id);
  const boundRemoveAction = removeEmployeePhoto.bind(null, id);
  const [photoUrl, documentUrls] = await Promise.all([
    getEmployeePhotoSignedUrl(employee.photo_url),
    getEmployeeDocumentSignedUrls(employee),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit employee</h1>
          <p className="text-sm text-muted-foreground">
            {employee.employee_code} — {employee.first_name} {employee.last_name}
          </p>
        </div>
        <LinkButton variant="outline" href={`/hr/employees/${id}`}>
          Back to employee
        </LinkButton>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Employee details</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeForm
            action={boundAction}
            employee={employee as Employee}
            submitLabel="Save changes"
            redirectTo={`/hr/employees/${id}`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Profile photo
            </h2>
            <EmployeePhotoUpload
              firstName={employee.first_name}
              lastName={employee.last_name}
              photoUrl={photoUrl}
              uploadAction={boundUploadAction}
              removeAction={boundRemoveAction}
            />
          </div>
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Staff documents
            </h2>
            <EmployeeDocumentsPanel
              employee={employee as Employee}
              signedUrls={documentUrls}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              PDF, JPEG, PNG, or WebP up to 10 MB each.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
