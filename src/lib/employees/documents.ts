export const EMPLOYEE_DOCUMENTS_BUCKET = "employee-documents";

export const MAX_EMPLOYEE_DOCUMENT_BYTES = 10 * 1024 * 1024;

export const ALLOWED_EMPLOYEE_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedEmployeeDocumentType =
  (typeof ALLOWED_EMPLOYEE_DOCUMENT_TYPES)[number];

export type EmployeeDocumentType = "cv" | "employment_letter" | "id_card";

export type EmployeeDocumentConfig = {
  type: EmployeeDocumentType;
  column: "cv_url" | "employment_letter_url" | "id_document_url";
  label: string;
  storageName: string;
  description: string;
};

export const EMPLOYEE_DOCUMENTS: EmployeeDocumentConfig[] = [
  {
    type: "cv",
    column: "cv_url",
    label: "CV",
    storageName: "cv",
    description: "Curriculum vitae or résumé on file.",
  },
  {
    type: "employment_letter",
    column: "employment_letter_url",
    label: "Employment letter",
    storageName: "employment-letter",
    description: "Signed offer or employment letter.",
  },
  {
    type: "id_card",
    column: "id_document_url",
    label: "ID card",
    storageName: "id-card",
    description: "Government-issued identity card (saved on file).",
  },
];

export const EMPLOYEE_DOCUMENT_BY_TYPE = Object.fromEntries(
  EMPLOYEE_DOCUMENTS.map((doc) => [doc.type, doc]),
) as Record<EmployeeDocumentType, EmployeeDocumentConfig>;

export function employeeDocumentStoragePath(
  employeeId: string,
  storageName: string,
  extension: string,
): string {
  return `${employeeId}/${storageName}.${extension}`;
}

export function documentExtensionFromMime(mime: string): string | null {
  switch (mime) {
    case "application/pdf":
      return "pdf";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
}

export function validateEmployeeDocumentFile(file: File): string | null {
  if (
    !ALLOWED_EMPLOYEE_DOCUMENT_TYPES.includes(
      file.type as AllowedEmployeeDocumentType,
    )
  ) {
    return "Document must be a PDF, JPEG, PNG, or WebP file.";
  }

  if (file.size > MAX_EMPLOYEE_DOCUMENT_BYTES) {
    return "Document must be 10 MB or smaller.";
  }

  return null;
}

export function fileNameFromStoragePath(path: string): string {
  const segment = path.split("/").pop();
  return segment ?? "document";
}

export function isPdfStoragePath(path: string): boolean {
  return path.toLowerCase().endsWith(".pdf");
}

export function previewKindForStoragePath(
  path: string,
): "image" | "pdf" {
  return isPdfStoragePath(path) ? "pdf" : "image";
}

export function isEmployeeDocumentType(
  value: string,
): value is EmployeeDocumentType {
  return value in EMPLOYEE_DOCUMENT_BY_TYPE;
}

export function employeeDocumentPagePath(
  employeeId: string,
  documentType: EmployeeDocumentType,
): string {
  return `/hr/employees/${employeeId}/documents/${documentType}`;
}

export function employeeDocumentStreamPath(
  employeeId: string,
  documentType: EmployeeDocumentType,
): string {
  return `/api/hr/employees/${employeeId}/documents/${documentType}`;
}
