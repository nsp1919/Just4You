import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE_SECONDS, verifyAdminIdToken, verifyAdminSession } from "@/lib/admin-session";
import { COLLECTIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

function normalizedOrigin(value: string | undefined): string {
  if (!value) return "";
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

function requestOriginAllowed(request: NextRequest): boolean {
  const origin = normalizedOrigin(request.headers.get("origin") ?? undefined);
  if (/^http:\/\/localhost:\d+$/.test(origin)) return true;

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0].trim();
  const host = forwardedHost || request.headers.get("host")?.split(",")[0].trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  const protocol = forwardedProto || request.nextUrl.protocol.replace(":", "");
  const requestOrigin = host ? normalizedOrigin(`${protocol}://${host}`) : "";
  const allowedOrigins = new Set([
    normalizedOrigin(process.env.NEXT_PUBLIC_SITE_URL),
    normalizedOrigin(process.env.NEXT_PUBLIC_APP_URL),
    normalizedOrigin(request.nextUrl.origin),
    requestOrigin,
    "https://just4you.buzz",
  ].filter(Boolean));
  return Boolean(origin && allowedOrigins.has(origin));
}

export async function POST(request: NextRequest) {
  try {
    if (!requestOriginAllowed(request)) {
      return NextResponse.json({ error: "Admin sign-in was rejected because the site address did not match. Refresh this page and try again." }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const idToken = typeof body.idToken === "string" ? body.idToken : "";
    const admin = await verifyAdminIdToken(idToken);
    if (!admin) {
      return NextResponse.json({ error: "This account is not the configured Admin account, or it has been blocked." }, { status: 403 });
    }

    const adminProfileRef = adminDb.collection(COLLECTIONS.USERS).doc(admin.uid);
    const adminProfile = await adminProfileRef.get();
    await adminProfileRef.set({
      uid: admin.uid,
      email: admin.email,
      role: "admin",
      ...(!adminProfile.exists ? { name: admin.email.split("@")[0] || "Admin", isBlocked: false, createdAt: new Date() } : {}),
    }, { merge: true });

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
  if (!requestOriginAllowed(request)) {
    return NextResponse.json({ error: "Admin sign-out was rejected because the site address did not match." }, { status: 403 });
  }
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