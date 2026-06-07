"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import { EmployeePhotoDisplay } from "@/components/employees/employee-photo-display";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { EmployeePhotoFormState } from "@/lib/actions/employees";
import {
  createEmployeePhotoPreviewUrl,
  processEmployeePhotoFile,
  revokeEmployeePhotoPreviewUrl,
} from "@/lib/employees/process-photo";

type EmployeePhotoUploadProps = {
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  uploadAction: (
    state: EmployeePhotoFormState,
    formData: FormData,
  ) => Promise<EmployeePhotoFormState>;
  removeAction: (
    state: EmployeePhotoFormState,
    formData: FormData,
  ) => Promise<EmployeePhotoFormState>;
};

export function EmployeePhotoUpload({
  firstName,
  lastName,
  photoUrl,
  uploadAction,
  removeAction,
}: EmployeePhotoUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadPending, startUploadTransition] = useTransition();
  const [uploadState, uploadFormAction, uploadActionPending] = useActionState(
    uploadAction,
    {},
  );
  const [removeState, removeFormAction, removePending] = useActionState(
    removeAction,
    {},
  );

  const displayPhotoUrl =
    uploadState.success || removeState.success
      ? photoUrl
      : (localPreviewUrl ?? photoUrl);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        revokeEmployeePhotoPreviewUrl(previewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (uploadState.success || removeState.success) {
      router.refresh();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (previewUrlRef.current) {
        revokeEmployeePhotoPreviewUrl(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    }
  }, [uploadState.success, removeState.success, router]);

  function handleFileChange() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      return;
    }

    if (previewUrlRef.current) {
      revokeEmployeePhotoPreviewUrl(previewUrlRef.current);
    }

    const nextPreviewUrl = createEmployeePhotoPreviewUrl(file);
    previewUrlRef.current = nextPreviewUrl;
    setLocalPreviewUrl(nextPreviewUrl);
    setUploadError(null);
  }

  function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setUploadError("Choose a photo to upload.");
      return;
    }

    setUploadError(null);

    startUploadTransition(async () => {
      try {
        const processed = await processEmployeePhotoFile(file);
        const formData = new FormData();
        formData.set("photo", processed);
        uploadFormAction(formData);
      } catch (error) {
        setUploadError(
          error instanceof Error
            ? error.message
            : "Could not prepare photo for upload.",
        );
      }
    });
  }

  const error = uploadError ?? uploadState.error ?? removeState.error;
  const success = uploadState.success || removeState.success;
  const pending = uploadPending || uploadActionPending || removePending;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <EmployeePhotoDisplay
          photoUrl={displayPhotoUrl}
          firstName={firstName}
          lastName={lastName}
          variant="edit"
        />
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <p className="text-sm font-medium">Profile photo</p>
            <p className="text-sm text-muted-foreground">
              Any portrait or square photo works — we crop and resize it to a
              standard 400×400 profile automatically (like BambooHR and Gusto).
              JPEG, PNG, WebP, or GIF up to 5 MB.
            </p>
          </div>

          <form onSubmit={handleUpload} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="photo">Choose photo</Label>
              <input
                ref={fileInputRef}
                id="photo"
                name="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium"
              />
            </div>
            <Button type="submit" disabled={pending}>
              {uploadPending || uploadActionPending
                ? "Uploading…"
                : "Upload photo"}
            </Button>
          </form>

          {photoUrl ? (
            <form action={removeFormAction}>
              <Button type="submit" variant="outline" disabled={pending}>
                {removePending ? "Removing…" : "Remove photo"}
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="text-sm text-emerald-700" role="status">
          Photo updated.
        </p>
      ) : null}
    </div>
  );
}
