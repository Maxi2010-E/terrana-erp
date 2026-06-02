import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function hasSupabaseSession(request: NextRequest): boolean {
  return request.cookies.getAll().some(
    (cookie) =>
      cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"),
  );
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === "/login";
  const isPublicRoute =
    pathname.startsWith("/auth") || pathname.startsWith("/login");
  const hasSessionCookie = hasSupabaseSession(request);

  if (pathname === "/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = hasSessionCookie ? "/dashboard" : "/login";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  // Anonymous visitors on login/auth — skip Supabase entirely (fast retries).
  if (!hasSessionCookie && isPublicRoute) {
    return NextResponse.next({ request });
  }

  if (!hasSessionCookie && !isPublicRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  if (hasSessionCookie) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user ?? null;

    if (user && isLoginPage) {
      const redirectParam = request.nextUrl.searchParams.get("redirect");
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = safeRedirectPath(redirectParam);
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (!user && !isPublicRoute) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
