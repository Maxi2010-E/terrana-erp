import { NextResponse } from "next/server";

import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: appUser } = await supabase
          .from("users")
          .select("status")
          .eq("id", user.id)
          .maybeSingle();

        if (appUser?.status === "disabled") {
          await supabase.auth.signOut();
          return NextResponse.redirect(
            `${origin}/login?error=account_disabled`,
          );
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
