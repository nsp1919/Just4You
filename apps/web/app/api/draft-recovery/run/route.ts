import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

async function handle(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) return NextResponse.json({ error: "Email provider not configured." }, { status: 500 });

  const snapshot = await adminDb.collection(COLLECTIONS.DRAFT_RECOVERIES).where("optedIn", "==", true).limit(500).get();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://just4you.buzz";
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  let sent = 0;
  let skipped = 0;

  for (const document of snapshot.docs) {
    const draft = document.data();
    if (draft.completed || draft.reminderSentAt || !draft.email || (draft.updatedAt?.toMillis?.() ?? Date.now()) > cutoff) { skipped++; continue; }
    if (draft.celebrationId) {
      const celebration = await adminDb.collection(COLLECTIONS.CELEBRATIONS).doc(draft.celebrationId).get();
      if (celebration.data()?.paymentStatus === "paid") {
        await document.ref.update({ completed: true, optedIn: false });
        skipped++;
        continue;
      }
    }

    const claimed = await adminDb.runTransaction(async (transaction) => {
      const current = await transaction.get(document.ref);
      const data = current.data();
      if (!data?.optedIn || data.completed || data.reminderSentAt || data.reminderClaimedAt) return false;
      transaction.update(document.ref, { reminderClaimedAt: Timestamp.now() });
      return true;
    });
    if (!claimed) { skipped++; continue; }

    const name = escapeHtml(String(draft.recipientName).slice(0, 80));
    const preview = typeof draft.photoUrl === "string" && draft.photoUrl.startsWith("https://res.cloudinary.com/") ? `<img src="${draft.photoUrl}" alt="" style="display:block;width:100%;max-height:260px;object-fit:cover;border-radius:10px;margin:20px 0" />` : "";
    try {
      await resend.emails.send({ from: process.env.RESEND_FROM_EMAIL, to: draft.email, subject: `Your surprise for ${draft.recipientName} is saved`, html: `<div style="font-family:Segoe UI,sans-serif;max-width:560px;margin:auto;padding:32px;color:#24152b"><p style="color:#a33d67;font-weight:700">YOUR DRAFT IS WAITING</p><h1>Finish ${name}'s surprise when you're ready</h1>${preview}<p>We saved your progress on this device. Continue from where you stopped; no discount countdown or pressure.</p><a href="${siteUrl}${draft.resumeUrl}" style="display:inline-block;background:#ff6f9c;color:#fff;text-decoration:none;padding:13px 22px;border-radius:8px;font-weight:700">Continue my draft</a><p style="margin-top:22px;color:#76677b;font-size:12px">You received this once because you asked us to email your saved draft.</p></div>` });
      await document.ref.update({ reminderSentAt: FieldValue.serverTimestamp(), reminderClaimedAt: FieldValue.delete() });
      sent++;
    } catch (error) {
      await document.ref.update({ reminderClaimedAt: FieldValue.delete() });
      console.error("draft recovery email failed:", document.id, error);
      skipped++;
    }
  }
  return NextResponse.json({ ok: true, scanned: snapshot.size, sent, skipped });
}

export async function GET(request: NextRequest) { return handle(request); }
export async function POST(request: NextRequest) { return handle(request); }