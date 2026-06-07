import { EmployeeDocumentSlot } from "@/components/employees/employee-document-slot";
import {
  removeEmployeeDocument,
  uploadEmployeeDocument,
} from "@/lib/actions/employees";
import {
  EMPLOYEE_DOCUMENTS,
  type EmployeeDocumentType,
} from "@/lib/employees/documents";
import type { Employee } from "@/lib/employees/types";

type EmployeeDocumentsPanelProps = {
  employee: Employee;
  signedUrls: Record<EmployeeDocumentType, string | null>;
};

export function EmployeeDocumentsPanel({
  employee,
  signedUrls,
}: EmployeeDocumentsPanelProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {EMPLOYEE_DOCUMENTS.map((config) => (
        <EmployeeDocumentSlot
          key={config.type}
          employeeId={employee.id}
          config={config}
          storagePath={employee[config.column]}
          signedUrl={signedUrls[config.type]}
          uploadAction={uploadEmployeeDocument.bind(
            null,
            employee.id,
            config.type,
          )}
          removeAction={removeEmployeeDocument.bind(
            null,
            employee.id,
            config.type,
          )}
        />
      ))}
    </div>
  );
}
