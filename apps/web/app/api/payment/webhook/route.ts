import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { releaseCheckoutBenefits } from "@/lib/referral-server";
import { fulfillCelebrationPayment } from "@/lib/payment-fulfillment";
import { signaturesMatch } from "@/lib/payment-signatures";

export const dynamic = "force-dynamic";
// Razorpay signs the exact raw bytes it POSTs — the Node runtime lets us read
// the untouched body via req.text() so the HMAC matches.
export const runtime = "nodejs";

const LOG = "razorpay-webhook";

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
        await fulfillCelebrationPayment(celebrationId, paymentId, customerEmail);
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
