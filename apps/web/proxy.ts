import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth-constants";

export function proxy(request: NextRequest) {
  if (!request.cookies.has(ADMIN_SESSION_COOKIE)) {
    const loginUrl = new URL("/admin-access", request.url);
    loginUrl.searchParams.set("reason", "session");
    return NextResponse.redirect(loginUrl);
  }
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};