"use server";

import { createClient } from "@/lib/supabase/server";

export async function recordLoginAttendance() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const now = new Date();
    const attendanceDate = now.toISOString().slice(0, 10);

    await supabase.from("attendance").insert({
      user_id: user.id,
      login_time: now.toISOString(),
      attendance_date: attendanceDate,
    });

    await supabase
      .from("users")
      .update({ last_login: now.toISOString() })
      .eq("id", user.id);
  } catch {
    // Attendance must never block login.
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
