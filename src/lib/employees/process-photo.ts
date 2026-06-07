/** Stored profile photo — square crop, matches common HR systems (BambooHR, Gusto, etc.). */
export const EMPLOYEE_PHOTO_TARGET_PX = 400;

export const EMPLOYEE_PHOTO_JPEG_QUALITY = 0.85;

export const EMPLOYEE_PHOTO_OUTPUT_TYPE = "image/jpeg";

export const EMPLOYEE_PHOTO_OUTPUT_NAME = "profile.jpg";

/**
 * Center-crops to square and resizes to a standard profile size before upload.
 * Keeps files small and consistent across the app.
 */
export async function processEmployeePhotoFile(file: File): Promise<File> {
  const bitmap = await loadImageBitmap(file);

  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = Math.floor((bitmap.width - side) / 2);
    const sy = Math.floor((bitmap.height - side) / 2);

    const canvas = document.createElement("canvas");
    canvas.width = EMPLOYEE_PHOTO_TARGET_PX;
    canvas.height = EMPLOYEE_PHOTO_TARGET_PX;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not prepare photo for upload.");
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, EMPLOYEE_PHOTO_TARGET_PX, EMPLOYEE_PHOTO_TARGET_PX);
    ctx.drawImage(
      bitmap,
      sx,
      sy,
      side,
      side,
      0,
      0,
      EMPLOYEE_PHOTO_TARGET_PX,
      EMPLOYEE_PHOTO_TARGET_PX,
    );

    const blob = await canvasToBlob(canvas, EMPLOYEE_PHOTO_JPEG_QUALITY);
    return new File([blob], EMPLOYEE_PHOTO_OUTPUT_NAME, {
      type: EMPLOYEE_PHOTO_OUTPUT_TYPE,
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}

function loadImageBitmap(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file, {
    imageOrientation: "from-image",
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not compress photo."));
          return;
        }
        resolve(blob);
      },
      EMPLOYEE_PHOTO_OUTPUT_TYPE,
      quality,
    );
  });
}

export function createEmployeePhotoPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

export function revokeEmployeePhotoPreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}
