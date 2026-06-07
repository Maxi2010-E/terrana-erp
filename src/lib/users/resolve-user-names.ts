import { createClient } from "@/lib/supabase/server";

export async function resolveUserDisplayNames(
  userIds: Array<string | null | undefined>,
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))] as string[];

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("resolve_user_display_names", {
    user_ids: uniqueIds,
  });

  if (error) {
    console.error("resolve_user_display_names:", error.message);
    return new Map();
  }

  return new Map(
    (data ?? []).map((row: { id: string; display_name: string }) => [
      row.id,
      row.display_name,
    ]),
  );
}

export function nameFromMap(
  nameByUserId: Map<string, string>,
  userId: string | null | undefined,
): string | null {
  if (!userId) {
    return null;
  }

  return nameByUserId.get(userId) ?? null;
}
