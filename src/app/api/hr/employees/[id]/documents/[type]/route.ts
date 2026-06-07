import { NextResponse } from "next/server";

import { getEmployeeById, getEmployeeDocumentSignedUrl } from "@/lib/actions/employees";
import { requireHrAdmin } from "@/lib/auth/require-role";
import {
  EMPLOYEE_DOCUMENT_BY_TYPE,
  isEmployeeDocumentType,
  isPdfStoragePath,
} from "@/lib/employees/documents";

type DocumentStreamRouteProps = {
  params: Promise<{ id: string; type: string }>;
};

export async function GET(_request: Request, { params }: DocumentStreamRouteProps) {
  await requireHrAdmin();
  const { id, type } = await params;

  if (!isEmployeeDocumentType(type)) {
    return NextResponse.json({ error: "Document type not found." }, { status: 404 });
  }

  const employee = await getEmployeeById(id);
  if (!employee) {
    return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  }

  const config = EMPLOYEE_DOCUMENT_BY_TYPE[type];
  const storagePath = employee[config.column];
  if (!storagePath) {
    return NextResponse.json({ error: "Document not uploaded." }, { status: 404 });
  }

  const signedUrl = await getEmployeeDocumentSignedUrl(storagePath);
  if (!signedUrl) {
    return NextResponse.json({ error: "Could not load document." }, { status: 502 });
  }

  const upstream = await fetch(signedUrl);
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Could not fetch document." }, { status: 502 });
  }

  const contentType =
    upstream.headers.get("Content-Type") ??
    (isPdfStoragePath(storagePath) ? "application/pdf" : "application/octet-stream");

  return new Response(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
    },
  });
}
