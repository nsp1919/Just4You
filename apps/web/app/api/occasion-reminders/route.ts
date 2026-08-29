import { createHash, randomBytes } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";

const OCCASIONS = new Set(["birthday", "anniversary", "wedding", "proposal", "graduation", "other"]);

function text(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().replace(/[\r\n]+/g, " ").slice(0, maxLength) : "";
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin") ?? "";
    const siteOrigin = new URL(process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin).origin;
    if (origin !== siteOrigin && !/^http:\/\/localhost:\d+$/.test(origin)) {
      return NextResponse.json({ error: "Reminder signup is only available on Just4You." }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    if (text(body.website, 100)) return NextResponse.json({ saved: true });
    const email = text(body.email, 160).toLowerCase();
    const subscriberName = text(body.subscriberName, 80);
    const recipientName = text(body.recipientName, 80);
    const occasionType = text(body.occasionType, 30);
    const occasionDate = text(body.occasionDate, 10);
    if (!subscriberName || !recipientName || !/^\S+@\S+\.\S+$/.test(email) || !OCCASIONS.has(occasionType) || !validDate(occasionDate) || body.consent !== true) {
      return NextResponse.json({ error: "Complete every field and consent to reminder emails." }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    if (!resendKey || !fromEmail) return NextResponse.json({ error: "Email reminders are not configured yet." }, { status: 503 });

    const reminderId = createHash("sha256").update(`${email}|${recipientName.toLowerCase()}|${occasionType}|${occasionDate.slice(5)}`).digest("hex");
    const unsubscribeToken = randomBytes(24).toString("base64url");
    const reminderRef = adminDb.collection(COLLECTIONS.OCCASION_REMINDERS).doc(reminderId);
    const existing = await reminderRef.get();
    if ((existing.data()?.updatedAt?.toMillis?.() ?? 0) > Date.now() - 5 * 60 * 1000) {
      return NextResponse.json({ error: "This reminder was just saved. Check your inbox for confirmation." }, { status: 429 });
    }
    await reminderRef.set({
      email,
      subscriberName,
      recipientName,
      occasionType,
      occasionDate,
      active: true,
      unsubscribeToken,
      sentKeys: [],
      consentAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://just4you.buzz";
    const unsubscribeUrl = `${siteUrl}/api/occasion-reminders/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
    const resend = new Resend(resendKey);
    try {
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: `Reminders saved for ${recipientName.replace(/[\r\n]+/g, " ")}`,
        html: `<div style="font-family:Segoe UI,sans-serif;max-width:560px;margin:auto;padding:32px;color:#24152b"><h1 style="font-size:24px">You won't miss ${escapeHtml(recipientName)}'s special day</h1><p>We'll email you 14, 7, and 2 days before the date so you have time to plan something meaningful.</p><p style="color:#6b5c70">You can unsubscribe at any time.</p><a href="${unsubscribeUrl}" style="color:#a33d67">Stop these reminders</a></div>`,
      });
    } catch (emailError) {
      await reminderRef.update({ active: false });
      throw emailError;
    }
    return NextResponse.json({ saved: true }, { status: 201 });
  } catch (error) {
    console.error("occasion reminder signup failed:", error);
    return NextResponse.json({ error: "Unable to save this reminder." }, { status: 500 });
  }
}