import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/roles";

export type AppUser = {
  id: string;
  email: string;
  role: AppRole;
  status: string;
};

/** Cached per request — one Supabase auth + profile read per page render. */
export const getSessionUser = cache(async (): Promise<{
  authUser: { id: string; email?: string } | null;
  appUser: AppUser | null;
}> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authUser: null, appUser: null };
  }

  const { data: appUser } = await supabase
    .from("users")
    .select("id, email, role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (appUser?.status === "disabled") {
    await supabase.auth.signOut();
    redirect("/login?error=account_disabled");
  }

  return {
    authUser: { id: user.id, email: user.email },
    appUser: appUser as AppUser | null,
  };
});
