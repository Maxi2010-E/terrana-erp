import { type NextRequest, NextResponse } from "next/server";

import {
  PAYROLL_BANNER_PREVIEW_COOKIE,
  PAYROLL_BANNER_PREVIEW_QUERY,
} from "@/lib/payroll/notifications";
import { updateSession } from "@/lib/supabase/middleware";

function applyDevPayrollBannerPreviewCookie(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  if (process.env.NODE_ENV !== "development") {
    return response;
  }

  const preview = request.nextUrl.searchParams.get(PAYROLL_BANNER_PREVIEW_QUERY);
  if (preview === "1") {
    response.cookies.set(PAYROLL_BANNER_PREVIEW_COOKIE, "1", {
      path: "/",
      maxAge: 60 * 60,
      sameSite: "lax",
    });
  } else if (preview === "0") {
    response.cookies.set(PAYROLL_BANNER_PREVIEW_COOKIE, "", {
      path: "/",
      maxAge: 0,
    });
  }

  return response;
}

export async function proxy(request: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    const preview = request.nextUrl.searchParams.get(PAYROLL_BANNER_PREVIEW_QUERY);
    if (preview === "1") {
      request.headers.set("x-payroll-banner-preview", "1");
    } else if (preview === "0") {
      request.headers.delete("x-payroll-banner-preview");
    }
  }

  const response = await updateSession(request);
  return applyDevPayrollBannerPreviewCookie(request, response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
