import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPath = pathname.startsWith("/admin");
  const isAppPath =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/account") ||
    isAdminPath;

  const response = await updateSession(request);

  if (!isAppPath) return response;

  const demo = request.cookies.get("clipora_demo_role")?.value;
  if (isAdminPath && demo === "user") {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/access-restricted";
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/account/:path*", "/admin/:path*", "/sign-in", "/sign-up", "/forgot-password"],
};
