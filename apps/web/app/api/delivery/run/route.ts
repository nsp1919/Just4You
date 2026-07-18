import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Resend } from "resend";

// Scheduled-delivery cron. Emails the surprise link to the recipient at the
// creator's chosen time. Runs on a schedule (see vercel.json) and is protected
// by CRON_SECRET. Delivery precision depends on the cron frequency.
//
// Trigger:  GET /api/delivery/run  with  Authorization: Bearer <CRON_SECRET>

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Delivery not configured (missing CRON_SECRET)." }, { status: 500 });
  }
  if (req.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!resendKey || !fromEmail) {
    return NextResponse.json({ error: "Email provider not configured." }, { status: 500 });
  }
  const resend = new Resend(resendKey);
  const birthdayUrl = process.env.NEXT_PUBLIC_BIRTHDAY_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://just4you.buzz";
  const nowIso = new Date().toISOString();

  // Due = paid, active, scheduled in the past, not yet delivered.
  let snap;
  try {
    snap = await adminDb
      .collection("celebrations")
      .where("paymentStatus", "==", "paid")
      .where("scheduledDeliveryAt", "<=", nowIso)
      .limit(50)
      .get();
  } catch (e) {
    // Likely a missing composite index on first run — fail soft.
    console.error("delivery: query failed (needs composite index?)", e);
    return NextResponse.json({ ok: true, scanned: 0, sent: 0, skipped: 0, note: "index building" });
  }

  let sent = 0;
  let skipped = 0;

  for (const doc of snap.docs) {
    const c = doc.data() as any;
    if (c.deliveredAt || !c.slug || c.isActive === false) { skipped++; continue; }

    const link = `${birthdayUrl}/wish/${c.slug}`;
    const occasion = c.occasionType || "birthday";
    const emoji = occasion === "anniversary" ? "💍" : occasion === "proposal" ? "💌" : occasion === "kids-birthday" ? "🧸" : "🎂";

    // Prefer the recipient's email; otherwise nudge the creator to send it.
    let to = c.recipientEmail as string | undefined;
    let toRecipient = true;
    if (!to) {
      try {
        const u = await adminDb.collection("users").doc(c.userId).get();
        to = u.data()?.email;
        toRecipient = false;
      } catch { /* ignore */ }
    }
    if (!to) { skipped++; continue; }

    const subject = toRecipient
      ? `${emoji} ${c.recipientName}, someone made you a surprise!`
      : `${emoji} Your scheduled surprise for ${c.recipientName} is ready to send`;
    const heading = toRecipient
      ? `A surprise is waiting for you ${emoji}`
      : `It's time — your surprise for ${c.recipientName} is live`;
    const cta = toRecipient ? "Open your surprise →" : "View & share it now →";

    try {
      await resend.emails.send({
        from: fromEmail,
        to,
        subject,
        html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0612;font-family:'Segoe UI',sans-serif;color:#f8f4ff">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px">
    <div style="text-align:center;margin-bottom:24px"><div style="font-size:44px">${emoji}</div>
      <div style="font-size:22px;font-weight:bold;background:linear-gradient(135deg,#a855f7,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Just4You</div></div>
    <div style="background:rgba(18,9,31,0.8);border:1px solid rgba(168,85,247,0.2);border-radius:24px;padding:32px;text-align:center">
      <h1 style="font-size:24px;margin:0 0 10px">${heading}</h1>
      <p style="color:#9b8ec4;margin:0 0 28px">Tap below to open the personalized surprise made just ${toRecipient ? "for you" : `for ${c.recipientName}`}.</p>
      <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#ff8a5c,#ff5f93);color:white;text-decoration:none;padding:15px 30px;border-radius:9999px;font-weight:700">${cta}</a>
    </div>
    <p style="text-align:center;color:#6a5d73;font-size:12px;margin-top:20px">Made with ❤️ by Just4You</p>
  </div>
</body></html>`,
      });
      await doc.ref.update({ deliveredAt: nowIso });
      sent++;
    } catch (e) {
      console.error("delivery: failed for", doc.id, e);
      skipped++;
    }
  }

  return NextResponse.json({ ok: true, scanned: snap.size, sent, skipped });
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}
