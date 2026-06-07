import { notFound } from "next/navigation";

import { LinkButton } from "@/components/ui/link-button";
import { getEmployeeById } from "@/lib/actions/employees";
import { requireHrAdmin } from "@/lib/auth/require-role";
import {
  EMPLOYEE_DOCUMENT_BY_TYPE,
  employeeDocumentStreamPath,
  isEmployeeDocumentType,
  previewKindForStoragePath,
} from "@/lib/employees/documents";

type EmployeeDocumentPageProps = {
  params: Promise<{ id: string; type: string }>;
};

export default async function EmployeeDocumentPage({
  params,
}: EmployeeDocumentPageProps) {
  await requireHrAdmin();
  const { id, type } = await params;

  if (!isEmployeeDocumentType(type)) {
    notFound();
  }

  const employee = await getEmployeeById(id);
  if (!employee) {
    notFound();
  }

  const config = EMPLOYEE_DOCUMENT_BY_TYPE[type];
  const storagePath = employee[config.column];
  if (!storagePath) {
    notFound();
  }

  const fullName = `${employee.first_name} ${employee.last_name}`;
  const previewKind = previewKindForStoragePath(storagePath);
  const streamUrl = employeeDocumentStreamPath(id, type);

  return (
    <div className="-mx-4 -mt-4 flex h-[calc(100dvh-3rem)] flex-col lg:-mx-8 lg:-mt-8">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b bg-background px-4 py-3 lg:px-8">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight">{config.label}</h1>
          <p className="truncate text-sm text-muted-foreground">
            {fullName} · {employee.employee_code}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <LinkButton variant="outline" size="sm" href={`/hr/employees/${id}`}>
            Back to employee
          </LinkButton>
          <LinkButton
            variant="ghost"
            size="sm"
            href={streamUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in new tab
          </LinkButton>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 bg-muted/30">
        {previewKind === "pdf" ? (
          <iframe
            src={streamUrl}
            title={config.label}
            className="absolute inset-0 size-full border-0 bg-background"
          />
        ) : (
          <div className="absolute inset-0 overflow-auto p-4 lg:p-6">
            <div className="mx-auto flex min-h-full w-full max-w-6xl items-start justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={streamUrl}
                alt={config.label}
                className="h-auto w-full max-w-none rounded-lg bg-background object-contain shadow-sm"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
