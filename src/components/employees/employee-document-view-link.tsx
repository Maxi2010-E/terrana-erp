import Link from "next/link";

import {
  employeeDocumentPagePath,
  type EmployeeDocumentType,
} from "@/lib/employees/documents";
import { cn } from "@/lib/utils";

type EmployeeDocumentViewLinkProps = {
  employeeId: string;
  documentType: EmployeeDocumentType;
  className?: string;
};

export function EmployeeDocumentViewLink({
  employeeId,
  documentType,
  className,
}: EmployeeDocumentViewLinkProps) {
  return (
    <Link
      href={employeeDocumentPagePath(employeeId, documentType)}
      className={cn(
        "inline-flex shrink-0 font-medium text-primary underline-offset-4 hover:underline",
        className,
      )}
    >
      View
    </Link>
  );
}
