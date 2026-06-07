"use client";

import { EmployeePhotoDisplay } from "@/components/employees/employee-photo-display";
import { FilePreviewTrigger } from "@/components/files/file-preview-dialog";
import { cn } from "@/lib/utils";

type EmployeePhotoPreviewProps = {
  employeeId: string;
  photoUrl: string | null;
  firstName: string;
  lastName: string;
  variant?: "compact" | "edit" | "profile";
  className?: string;
};

export function EmployeePhotoPreview({
  employeeId,
  photoUrl,
  firstName,
  lastName,
  variant = "edit",
  className,
}: EmployeePhotoPreviewProps) {
  const fullName = `${firstName} ${lastName}`;

  if (!photoUrl) {
    return (
      <EmployeePhotoDisplay
        photoUrl={null}
        firstName={firstName}
        lastName={lastName}
        variant={variant}
        className={className}
      />
    );
  }

  return (
    <FilePreviewTrigger
      title={fullName}
      url={photoUrl}
      kind="image"
      fullPageHref={`/hr/employees/${employeeId}/photo`}
      className={cn(
        "shrink-0 rounded-full transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      <EmployeePhotoDisplay
        photoUrl={photoUrl}
        firstName={firstName}
        lastName={lastName}
        variant={variant}
      />
      <span className="sr-only">View profile photo</span>
    </FilePreviewTrigger>
  );
}
