import type { AppRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export async function resolveUserRoles(
  userIds: Array<string | null | undefined>,
): Promise<Map<string, AppRole>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))] as string[];

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, role")
    .in("id", uniqueIds);

  if (error) {
    console.error("resolveUserRoles:", error.message);
    return new Map();
  }

  return new Map(
    (data ?? []).map((row: { id: string; role: AppRole }) => [row.id, row.role]),
  );
}

export function roleFromMap(
  roleByUserId: Map<string, AppRole>,
  userId: string | null | undefined,
): AppRole | null {
  if (!userId) {
    return null;
  }

  return roleByUserId.get(userId) ?? null;
}
