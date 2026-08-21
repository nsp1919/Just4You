import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { customAlphabet } from "nanoid";
import { Resend } from "resend";
import { COLLECTIONS, VALIDITY_DAYS } from "@/lib/constants";
import { releaseCheckoutBenefits, settlePaidReferralBenefits } from "@/lib/referral-server";
import { notifyAdminOfPaidOrder } from "@/lib/order-notification";

export const dynamic = "force-dynamic";
// Razorpay signs the exact raw bytes it POSTs — the Node runtime lets us read
// the untouched body via req.text() so the HMAC matches.
export const runtime = "nodejs";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);
const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key_for_build");

const LOG = "razorpay-webhook";

/**
 * Constant-time comparison of two hex signatures. Prevents timing side-channels
 * that a naive `===` on the secret-derived digest could leak.
 */
function signaturesMatch(expected: string, received: string): boolean {
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(received, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Razorpay places our `notes` on different entities depending on the event.
 * Pull the celebrationId + payment id from whichever entity is present.
 */
function extractContext(event: string, payload: any): {
  celebrationId?: string;
  paymentId?: string;
  customerEmail?: string;
} {
  const payment = payload?.payment?.entity;
  const link = payload?.payment_link?.entity;
  const order = payload?.order?.entity;

  const celebrationId =
    payment?.notes?.celebrationId ??
    link?.notes?.celebrationId ??
    order?.notes?.celebrationId;

  return {
    celebrationId,
    paymentId: payment?.id,
    customerEmail: payment?.email,
  };
}

/**
 * Idempotent fulfillment for a successfully-paid celebration:
 * generate a slug, activate the site, credit any referral, and email the buyer.
 * Safe to call more than once — repeated events short-circuit on the paid flag.
 */
async function fulfillCelebration(
  celebrationId: string,
  paymentId: string | undefined,
  customerEmail: string | undefined,
): Promise<void> {
  const celebRef = adminDb.collection(COLLECTIONS.CELEBRATIONS).doc(celebrationId);
  const celebSnap = await celebRef.get();

  if (!celebSnap.exists) {
    console.error(`[${LOG}] Celebration ${celebrationId} not found — ignoring.`);
    return;
  }

  const celebData = celebSnap.data() as any;

  // Idempotency guard: a captured payment can be delivered multiple times.
  if (celebData.paymentStatus === "paid" && celebData.isActive) {
    await settlePaidReferralBenefits(celebrationId);
    console.log(`[${LOG}] Celebration ${celebrationId} already fulfilled — skipping.`);
    return;
  }

  // Unique slug with collision retry (up to 5 attempts).
  let slug = "";
  const MAX_SLUG_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const candidate = nanoid();
    const existing = await adminDb
      .collection(COLLECTIONS.CELEBRATIONS)
      .where("slug", "==", candidate)
      .get();
    if (existing.empty) {
      slug = candidate;
      break;
    }
    console.warn(`[${LOG}] Slug collision on attempt ${attempt + 1}: "${candidate}"`);
  }
  if (!slug) {
    // Throw so the caller returns 5xx and Razorpay retries the delivery.
    throw new Error(`Failed to generate a unique slug for ${celebrationId}`);
  }

  // Hosting length depends on the purchased tier (default 1 year).
  const hostingFeatures: string[] = Array.isArray(celebData?.selectedFeatures)
    ? celebData.selectedFeatures
    : [];
  const hostingDays = hostingFeatures.includes("hosting_lifetime")
    ? 36500
    : hostingFeatures.includes("hosting_3yr")
      ? VALIDITY_DAYS * 3
      : VALIDITY_DAYS;
  const expiresAt = Timestamp.fromDate(
    new Date(Date.now() + hostingDays * 24 * 60 * 60 * 1000)
  );

  await celebRef.update({
    slug,
    ...(paymentId ? { razorpayPaymentId: paymentId } : {}),
    paymentStatus: "paid",
    isActive: true,
    expiresAt,
  });
  console.log(`[${LOG}] Celebration ${celebrationId} activated with slug: ${slug}`);

  try {
    await settlePaidReferralBenefits(celebrationId);
  } catch (e) {
    console.error(`[${LOG}] Referral settlement failed for ${celebrationId}:`, e);
  }

  // ── Confirmation email (best-effort) ──────────────────────────────────────
  let userEmail = customerEmail;
  try {
    if (celebData.userId) {
      const userRecord = await adminAuth.getUser(celebData.userId);
      if (userRecord.email) userEmail = userRecord.email;
    }
  } catch (authError) {
    console.error(`[${LOG}] Could not resolve email for userId ${celebData.userId}:`, authError);
  }

  await notifyAdminOfPaidOrder(celebrationId, userEmail);

  if (userEmail) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: userEmail,
        ...buildConfirmationEmail(celebData, slug, expiresAt),
      });
      console.log(`[${LOG}] Confirmation email dispatched to ${userEmail}`);
    } catch (emailError) {
      console.error(`[${LOG}] Failed to send confirmation email:`, emailError);
    }
  }
}

/** Builds the subject + HTML for the "your website is live" email. */
function buildConfirmationEmail(
  celebData: any,
  slug: string,
  expiresAt: Timestamp,
): { subject: string; html: string } {
  const occasion = celebData.occasionType || "birthday";
  const occasionEmoji =
    occasion === "anniversary" ? "💍" : occasion === "proposal" ? "💌" : occasion === "kids-birthday" ? "🧸" : "🎂";
  const occasionLabel =
    occasion === "anniversary" ? "Anniversary" : occasion === "proposal" ? "Proposal" : occasion === "kids-birthday" ? "Kids Birthday" : "Birthday";

  const birthdayUrl = `${process.env.NEXT_PUBLIC_BIRTHDAY_APP_URL}/wish/${slug}`;
  const whatsappMsg = encodeURIComponent(
    `${occasionEmoji} I created a beautiful ${occasionLabel.toLowerCase()} surprise website for you!\n\nVisit: ${birthdayUrl}`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappMsg}`;

  return {
    subject: `🎉 Your Just4You website is ready! — ${celebData.recipientName}'s ${occasionLabel}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>Your Just4You Website is Live!</title></head>
<body style="margin:0;padding:0;background:#0a0612;font-family:'Segoe UI',sans-serif;color:#f8f4ff">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px">
    <div style="text-align:center;margin-bottom:32px">
      <div style="font-size:48px;margin-bottom:8px">${occasionEmoji}</div>
      <div style="font-size:24px;font-weight:bold;background:linear-gradient(135deg,#a855f7,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Just4You</div>
    </div>
    <div style="background:rgba(18,9,31,0.8);border:1px solid rgba(168,85,247,0.2);border-radius:24px;padding:32px">
      <h1 style="font-size:28px;text-align:center;margin-bottom:8px">🎉 Your website is LIVE!</h1>
      <p style="color:#9b8ec4;text-align:center;margin-bottom:32px">
        The surprise website for <strong style="color:#f8f4ff">${celebData.recipientName}</strong> is ready to share!
      </p>
      <div style="background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.3);border-radius:16px;padding:20px;text-align:center;margin-bottom:24px">
        <div style="font-size:12px;color:#9b8ec4;margin-bottom:8px">Your unique surprise website link:</div>
        <div style="font-size:18px;font-weight:bold;color:#a855f7;word-break:break-all">${birthdayUrl}</div>
      </div>
      <div style="text-align:center;margin-bottom:24px">
        <a href="${birthdayUrl}" style="display:inline-block;background:linear-gradient(135deg,#a855f7,#ec4899);color:white;text-decoration:none;padding:16px 32px;border-radius:9999px;font-weight:600;font-size:16px">
          🌟 View Surprise Website
        </a>
      </div>
      <div style="text-align:center">
        <a href="${whatsappUrl}" style="display:inline-block;background:#25d366;color:white;text-decoration:none;padding:12px 24px;border-radius:9999px;font-weight:600;font-size:14px">
          📱 Share on WhatsApp
        </a>
      </div>
    </div>
    <p style="text-align:center;color:#9b8ec4;font-size:12px;margin-top:24px">
      This website will stay live until ${expiresAt.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.<br/>
      Made with ❤️ by Just4You
    </p>
  </div>
</body>
</html>
    `,
  };
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error(`[${LOG}] RAZORPAY_WEBHOOK_SECRET is not configured.`);
    return NextResponse.json(
      { error: "Webhook secret is not configured." },
      { status: 500 }
    );
  }

  // Read the raw body FIRST — the signature is computed over the exact bytes.
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    console.warn(`[${LOG}] Missing x-razorpay-signature header.`);
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (!signaturesMatch(expectedSignature, signature)) {
    console.warn(`[${LOG}] Signature verification failed.`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    console.warn(`[${LOG}] Body is not valid JSON.`);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const event: string = body?.event ?? "";
  const { celebrationId, paymentId, customerEmail } = extractContext(event, body?.payload);

  try {
    switch (event) {
      // A payment was captured — either from an order (Checkout) or a Payment Link.
      case "payment.captured":
      case "order.paid":
      case "payment_link.paid": {
        if (!celebrationId) {
          console.warn(`[${LOG}] "${event}" received without notes.celebrationId — acknowledging.`);
          return NextResponse.json({ success: true, message: "No celebrationId note" });
        }
        console.log(`[${LOG}] Handling "${event}" for celebration ${celebrationId}`);
        await fulfillCelebration(celebrationId, paymentId, customerEmail);
        return NextResponse.json({ success: true });
      }

      // Payment failed — record it so the dashboard can surface a retry.
      case "payment.failed": {
        if (celebrationId) {
          try {
            await releaseCheckoutBenefits(celebrationId);
            await adminDb
              .collection(COLLECTIONS.CELEBRATIONS)
              .doc(celebrationId)
              .update({
                paymentStatus: "failed",
                lastPaymentError:
                  body?.payload?.payment?.entity?.error_description ?? "Payment failed",
              });
          } catch (e) {
            console.error(`[${LOG}] Could not record failure for ${celebrationId}:`, e);
          }
        }
        console.log(`[${LOG}] Recorded payment.failed for ${celebrationId ?? "unknown"}`);
        return NextResponse.json({ success: true });
      }

      default:
        // Acknowledge unhandled events so Razorpay doesn't keep retrying them.
        console.log(`[${LOG}] Ignoring unhandled event "${event}".`);
        return NextResponse.json({ success: true, message: "Event ignored" });
    }
  } catch (error: any) {
    // Return 5xx so Razorpay retries — fulfillment is idempotent, so retries are safe.
    console.error(`[${LOG}] Error handling "${event}":`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
