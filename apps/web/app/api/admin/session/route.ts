import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE_SECONDS, verifyAdminIdToken, verifyAdminSession } from "@/lib/admin-session";
import { COLLECTIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

function requestOriginAllowed(request: NextRequest): boolean {
  const origin = request.headers.get("origin") ?? "";
  const expected = new URL(process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin).origin;
  return origin === expected || /^http:\/\/localhost:\d+$/.test(origin);
}

export async function POST(request: NextRequest) {
  try {
    if (!requestOriginAllowed(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json().catch(() => ({}));
    const idToken = typeof body.idToken === "string" ? body.idToken : "";
    const admin = await verifyAdminIdToken(idToken);
    if (!admin) return NextResponse.json({ error: "Admin access denied. Sign in again with the authorized account." }, { status: 403 });

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: ADMIN_SESSION_MAX_AGE_SECONDS * 1000,
    });
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
      path: "/",
    });
    await adminDb.collection(COLLECTIONS.ADMIN_AUDIT_LOGS).add({
      action: "admin_login",
      adminId: admin.uid,
      adminEmail: admin.email,
      userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? "",
      createdAt: new Date(),
    });
    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error("admin session creation failed:", error);
    return NextResponse.json({ error: "Unable to create the Admin session." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!requestOriginAllowed(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
  return NextResponse.json({ signedOut: true });
}

export async function GET(request: NextRequest) {
  const admin = await verifyAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  if (!admin) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, email: admin.email }, { headers: { "Cache-Control": "private, no-store" } });
}