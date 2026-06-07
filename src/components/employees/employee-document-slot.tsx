"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { EmployeeDocumentViewLink } from "@/components/employees/employee-document-view-link";
import { Button } from "@/components/ui/button";
import type { EmployeeDocumentFormState } from "@/lib/actions/employees";
import type { EmployeeDocumentConfig } from "@/lib/employees/documents";

type EmployeeDocumentSlotProps = {
  employeeId: string;
  config: EmployeeDocumentConfig;
  storagePath: string | null;
  signedUrl: string | null;
  uploadAction: (
    state: EmployeeDocumentFormState,
    formData: FormData,
  ) => Promise<EmployeeDocumentFormState>;
  removeAction: (
    state: EmployeeDocumentFormState,
    formData: FormData,
  ) => Promise<EmployeeDocumentFormState>;
};

export function EmployeeDocumentSlot({
  employeeId,
  config,
  storagePath,
  signedUrl,
  uploadAction,
  removeAction,
}: EmployeeDocumentSlotProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, uploadFormAction, uploadPending] = useActionState(
    uploadAction,
    {},
  );
  const [removeState, removeFormAction, removePending] = useActionState(
    removeAction,
    {},
  );

  useEffect(() => {
    if (uploadState.success || removeState.success) {
      router.refresh();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [uploadState.success, removeState.success, router]);

  const error = uploadState.error ?? removeState.error;
  const success = uploadState.success || removeState.success;
  const pending = uploadPending || removePending;
  const hasFile = Boolean(storagePath && signedUrl);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-lg border bg-muted/20 p-3 sm:min-w-[14rem] sm:basis-0">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold">{config.label}</span>
        <span className="text-muted-foreground" aria-hidden>
          ·
        </span>
        {hasFile ? (
          <>
            <span className="text-emerald-700">On file</span>
            <EmployeeDocumentViewLink
              employeeId={employeeId}
              documentType={config.type}
            />
          </>
        ) : (
          <span className="text-muted-foreground">Not uploaded</span>
        )}
      </div>

      <form action={uploadFormAction} className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          id={`document-${config.type}`}
          name="document"
          type="file"
          required
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="min-w-0 flex-1 text-xs file:mr-2 file:rounded-md file:border file:border-input file:bg-background file:px-2 file:py-1 file:text-xs"
        />
        <Button type="submit" size="sm" disabled={pending}>
          {uploadPending ? "…" : hasFile ? "Replace" : "Upload"}
        </Button>
      </form>

      {hasFile ? (
        <form action={removeFormAction}>
          <Button type="submit" size="sm" variant="ghost" disabled={pending}>
            {removePending ? "Removing…" : "Remove"}
          </Button>
        </form>
      ) : null}

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="text-xs text-emerald-700" role="status">
          Saved.
        </p>
      ) : null}
    </div>
  );
}
