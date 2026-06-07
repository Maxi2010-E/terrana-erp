import { createAdminClient } from "@/lib/supabase/admin";

import { EMPLOYEE_PHOTOS_BUCKET } from "./photo";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

/** Server-only — signs a storage path for display (e.g. sidebar profile). */
export async function signEmployeePhotoPath(
  photoPath: string | null | undefined,
): Promise<string | null> {
  if (!photoPath) {
    return null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(EMPLOYEE_PHOTOS_BUCKET)
    .createSignedUrl(photoPath, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}
