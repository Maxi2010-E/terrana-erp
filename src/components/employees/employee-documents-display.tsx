import { EmployeeDocumentViewLink } from "@/components/employees/employee-document-view-link";
import {
  EMPLOYEE_DOCUMENTS,
  type EmployeeDocumentType,
} from "@/lib/employees/documents";
import type { Employee } from "@/lib/employees/types";

type EmployeeDocumentsDisplayProps = {
  employeeId: string;
  employee: Employee;
  signedUrls: Record<EmployeeDocumentType, string | null>;
};

export function EmployeeDocumentsDisplay({
  employeeId,
  employee,
  signedUrls,
}: EmployeeDocumentsDisplayProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {EMPLOYEE_DOCUMENTS.map((doc) => {
        const storagePath = employee[doc.column];
        const signedUrl = signedUrls[doc.type];
        const hasFile = Boolean(storagePath && signedUrl);

        return (
          <div
            key={doc.type}
            className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border bg-muted/20 px-3 py-2 text-sm sm:min-w-[11rem] sm:basis-0"
          >
            <span className="shrink-0 font-semibold">{doc.label}</span>
            <span className="text-muted-foreground" aria-hidden>
              ·
            </span>
            {hasFile ? (
              <>
                <span className="shrink-0 text-emerald-700">On file</span>
                <EmployeeDocumentViewLink
                  employeeId={employeeId}
                  documentType={doc.type}
                />
              </>
            ) : (
              <span className="text-muted-foreground">Not uploaded</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
