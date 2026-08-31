import "server-only";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE_SECONDS } from "@/lib/admin-auth-constants";
import type { NextRequest } from "next/server";

export { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE_SECONDS };

export interface VerifiedAdminSession {
  uid: string;
  email: string;
}

function configuredAdminEmail(): string {
  return (process.env.ADMIN_EMAIL ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").trim().toLowerCase();
}

export async function verifyAdminSession(sessionCookie: string | undefined): Promise<VerifiedAdminSession | null> {
  if (!sessionCookie) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const profile = await adminDb.collection(COLLECTIONS.USERS).doc(decoded.uid).get();
    const expectedEmail = configuredAdminEmail();
    const email = decoded.email?.toLowerCase() ?? "";
    if (
      !profile.exists
      || profile.data()?.role !== "admin"
      || profile.data()?.isBlocked === true
      || (expectedEmail && email !== expectedEmail)
    ) {
      return null;
    }
    return { uid: decoded.uid, email };
  } catch {
    return null;
  }
}

export async function verifyAdminIdToken(idToken: string): Promise<VerifiedAdminSession | null> {
  try {
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    const signedInAt = Number(decoded.auth_time ?? 0) * 1000;
    if (!signedInAt || Date.now() - signedInAt > 5 * 60 * 1000) return null;

    const profile = await adminDb.collection(COLLECTIONS.USERS).doc(decoded.uid).get();
    const expectedEmail = configuredAdminEmail();
    const email = decoded.email?.toLowerCase() ?? "";
    if (
      !expectedEmail
      || email !== expectedEmail
      || profile.data()?.isBlocked === true
    ) {
      return null;
    }
    return { uid: decoded.uid, email };
  } catch {
    return null;
  }
}

export async function requireAdminRequest(request: NextRequest): Promise<VerifiedAdminSession> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const [idToken, session] = await Promise.all([
    adminAuth.verifyIdToken(authHeader.slice(7), true),
    verifyAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value),
  ]);
  if (!session || session.uid !== idToken.uid) throw new Error("ADMIN_SESSION_REQUIRED");
  return session;
}