import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Resend } from "resend";

// Occasion reminder cron. Nudges past creators when a recipient's occasion is
// coming up again (~a week ahead), turning one-time buyers into repeat ones —
// the biggest untapped LTV lever for the product.
//
// Trigger this on a daily schedule (e.g. Vercel Cron, GitHub Actions, or any
// scheduler) with an Authorization: Bearer <CRON_SECRET> header:
//   0 6 * * *  ->  GET /api/reminders/run
//
// Idempotency: each celebration stores `reminderSentYear` so a creator is
// nudged at most once per occasion per year, even if the cron runs daily.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const REMINDER_WINDOW_DAYS = 7; // fire when the occasion is within this many days
const FREE_REMINDER_DAYS = new Set([14, 7, 2]);

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function daysUntilNextOccurrence(eventDateIso: string, today: Date): number | null {
  // eventDateIso is "YYYY-MM-DD"; we only care about month/day recurring yearly.
  const parts = eventDateIso.split("-");
  if (parts.length < 3) return null;
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  if (Number.isNaN(month) || Number.isNaN(day)) return null;

  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let next = new Date(today.getFullYear(), month, day);
  if (next < startOfToday) next = new Date(today.getFullYear() + 1, month, day);

  return Math.round((next.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000));
}

async function handle(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Reminders not configured (missing CRON_SECRET)." }, { status: 500 });
  }
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!resendKey || !fromEmail) {
    return NextResponse.json({ error: "Email provider not configured." }, { status: 500 });
  }
  const resend = new Resend(resendKey);

  const today = new Date();
  const currentYear = today.getFullYear();

  // Only paid, active celebrations are eligible.
  const snap = await adminDb
    .collection("celebrations")
    .where("paymentStatus", "==", "paid")
    .get();

  let sent = 0;
  let skipped = 0;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://just4you.buzz";

  for (const doc of snap.docs) {
    const c = doc.data() as any;
    const eventDate: string | undefined = c.eventDate || c.birthdayDate;
    if (!eventDate) { skipped++; continue; }

    const days = daysUntilNextOccurrence(eventDate, today);
    if (days === null || days > REMINDER_WINDOW_DAYS) { skipped++; continue; }
    if (c.reminderSentYear === currentYear) { skipped++; continue; }

    // Look up the creator's email.
    let email: string | undefined;
    try {
      const userSnap = await adminDb.collection("users").doc(c.userId).get();
      email = userSnap.data()?.email;
    } catch {
      // ignore
    }
    if (!email) { skipped++; continue; }

    const occasion = c.occasionType || "birthday";
    const emoji = occasion === "anniversary" ? "💍" : occasion === "proposal" ? "💌" : occasion === "kids-birthday" ? "🧸" : "🎂";
    const label = occasion === "anniversary" ? "anniversary" : occasion === "proposal" ? "special day" : "birthday";
    const whenText = days <= 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;

    try {
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: `${emoji} ${c.recipientName}'s ${label} is ${whenText} — make another surprise?`,
        html: `
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0a0612;font-family:'Segoe UI',sans-serif;color:#f8f4ff">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px">
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-size:44px">${emoji}</div>
      <div style="font-size:22px;font-weight:bold;background:linear-gradient(135deg,#a855f7,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Just4You</div>
    </div>
    <div style="background:rgba(18,9,31,0.8);border:1px solid rgba(168,85,247,0.2);border-radius:24px;padding:32px;text-align:center">
      <h1 style="font-size:24px;margin:0 0 10px">${c.recipientName}'s ${label} is ${whenText}!</h1>
      <p style="color:#9b8ec4;margin:0 0 28px">Last time you made them something unforgettable. Want to surprise them again this year?</p>
      <a href="${siteUrl}/dashboard/create" style="display:inline-block;background:linear-gradient(135deg,#ff8a5c,#ff5f93);color:white;text-decoration:none;padding:15px 30px;border-radius:9999px;font-weight:700">
        Create a new surprise →
      </a>
    </div>
    <p style="text-align:center;color:#6a5d73;font-size:12px;margin-top:20px">Made with ❤️ by Just4You</p>
  </div>
</body></html>`,
      });
      await doc.ref.update({ reminderSentYear: currentYear });
      sent++;
    } catch (e) {
      console.error("reminders: failed to send for", doc.id, e);
      skipped++;
    }
  }

  const freeSnapshot = await adminDb.collection("occasionReminders").where("active", "==", true).get();
  for (const reminderDoc of freeSnapshot.docs) {
    const reminder = reminderDoc.data() as any;
    const days = daysUntilNextOccurrence(reminder.occasionDate, today);
    if (days === null || !FREE_REMINDER_DAYS.has(days)) { skipped++; continue; }
    const occurrenceYear = new Date(today.getFullYear(), Number(reminder.occasionDate.slice(5, 7)) - 1, Number(reminder.occasionDate.slice(8, 10))) < new Date(today.getFullYear(), today.getMonth(), today.getDate()) ? today.getFullYear() + 1 : today.getFullYear();
    const sentKey = `${occurrenceYear}-${days}`;
    const sentKeys = Array.isArray(reminder.sentKeys) ? reminder.sentKeys : [];
    if (sentKeys.includes(sentKey) || !reminder.email) { skipped++; continue; }

    const recipientName = escapeHtml(String(reminder.recipientName ?? "someone special").slice(0, 80));
    const whenText = `in ${days} days`;
    const unsubscribeUrl = `${siteUrl}/api/occasion-reminders/unsubscribe?token=${encodeURIComponent(reminder.unsubscribeToken ?? "")}`;
    try {
      await resend.emails.send({
        from: fromEmail,
        to: reminder.email,
        subject: `${String(reminder.recipientName).replace(/[\r\n]+/g, " ").slice(0, 80)}'s special day is ${whenText}`,
        html: `<div style="font-family:Segoe UI,sans-serif;max-width:560px;margin:auto;padding:32px;color:#24152b"><p style="color:#a33d67;font-weight:700">JUST4YOU REMINDER</p><h1>${recipientName}'s special day is ${whenText}</h1><p>You saved this date so there would be time to plan something meaningful.</p><a href="${siteUrl}/pricing" style="display:inline-block;background:#ff6f9c;color:white;text-decoration:none;padding:13px 22px;border-radius:8px;font-weight:700">Create a surprise</a><p style="margin-top:28px;font-size:12px"><a href="${unsubscribeUrl}" style="color:#76677b">Stop these reminders</a></p></div>`,
      });
      await reminderDoc.ref.update({ sentKeys: [...sentKeys.slice(-8), sentKey] });
      sent++;
    } catch (error) {
      console.error("free reminder delivery failed:", reminderDoc.id, error);
      skipped++;
    }
  }

  return NextResponse.json({ ok: true, scanned: snap.size + freeSnapshot.size, sent, skipped });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
