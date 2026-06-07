import { notFound } from "next/navigation";

import { LinkButton } from "@/components/ui/link-button";
import { getEmployeeById, getEmployeePhotoSignedUrl } from "@/lib/actions/employees";
import { requireHrAdmin } from "@/lib/auth/require-role";

type EmployeePhotoPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EmployeePhotoPage({ params }: EmployeePhotoPageProps) {
  await requireHrAdmin();
  const { id } = await params;
  const employee = await getEmployeeById(id);

  if (!employee) {
    notFound();
  }

  const photoUrl = await getEmployeePhotoSignedUrl(employee.photo_url);
  if (!photoUrl) {
    notFound();
  }

  const fullName = `${employee.first_name} ${employee.last_name}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{fullName}</h1>
          <p className="text-sm text-muted-foreground">Profile photo</p>
        </div>
        <LinkButton variant="outline" href={`/hr/employees/${id}`}>
          Back to employee
        </LinkButton>
      </div>

      <div className="flex min-h-[70vh] items-center justify-center rounded-2xl border bg-muted/20 p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={fullName}
          className="max-h-[85vh] w-auto max-w-full rounded-xl object-contain shadow-sm"
        />
      </div>
    </div>
  );
}
