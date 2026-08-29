import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const suppliedToken = request.nextUrl.searchParams.get("token") ?? "";
  const token = /^[A-Za-z0-9_-]{32}$/.test(suppliedToken) ? suppliedToken : "";
  return new NextResponse(`<!doctype html><html><body style="margin:0;background:#130d19;color:#fff;font-family:Segoe UI,sans-serif;display:grid;min-height:100vh;place-items:center"><main style="max-width:440px;text-align:center;padding:32px"><h1>Stop occasion reminders?</h1><p style="color:#b9a6be;line-height:1.6">Confirm below. Simply opening this page does not change your reminder settings.</p><form method="post"><input type="hidden" name="token" value="${token}" /><button style="border:0;border-radius:8px;background:#ff6f9c;color:#fff;padding:13px 22px;font-weight:700;cursor:pointer">Stop reminders</button></form></main></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const suppliedToken = String(form.get("token") ?? "");
  const token = /^[A-Za-z0-9_-]{32}$/.test(suppliedToken) ? suppliedToken : "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  if (token) {
    const snapshot = await adminDb.collection(COLLECTIONS.OCCASION_REMINDERS).where("unsubscribeToken", "==", token).limit(1).get();
    if (!snapshot.empty) await snapshot.docs[0].ref.update({ active: false });
  }
  return NextResponse.redirect(`${siteUrl}/reminders?unsubscribed=1`, 303);
}