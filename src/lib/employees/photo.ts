export const EMPLOYEE_PHOTOS_BUCKET = "employee-photos";

export const MAX_EMPLOYEE_PHOTO_BYTES = 5 * 1024 * 1024;

export const ALLOWED_EMPLOYEE_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type AllowedEmployeePhotoType =
  (typeof ALLOWED_EMPLOYEE_PHOTO_TYPES)[number];

export function employeePhotoStoragePath(
  employeeId: string,
  extension: string,
): string {
  return `${employeeId}/profile.${extension}`;
}

export function photoExtensionFromMime(mime: string): string | null {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return null;
  }
}

export function validateEmployeePhotoFile(file: File): string | null {
  if (!ALLOWED_EMPLOYEE_PHOTO_TYPES.includes(file.type as AllowedEmployeePhotoType)) {
    return "Photo must be a JPEG, PNG, WebP, or GIF image.";
  }

  if (file.size > MAX_EMPLOYEE_PHOTO_BYTES) {
    return "Photo must be 5 MB or smaller.";
  }

  return null;
}
