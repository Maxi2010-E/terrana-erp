"use server";

import { recordLoginSessionLegacy } from "@/lib/auth/record-login-session";
import { createClient } from "@/lib/supabase/server";

export async function recordLoginAttendance() {
  try {
    const supabase = await createClient();
    await recordLoginSessionLegacy(supabase);
  } catch {
    // OAuth login without geo — attendance marked invalid; must not block login.
  }
}

export async function recordLogoutAttendance() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { data: openSession } = await supabase
      .from("attendance")
      .select("id")
      .eq("user_id", user.id)
      .is("logout_time", null)
      .order("login_time", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (openSession?.id) {
      await supabase
        .from("attendance")
        .update({ logout_time: new Date().toISOString() })
        .eq("id", openSession.id);
    }
  } catch {
    // Logout must always complete.
  }
}
