import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { customAlphabet } from "nanoid";
import { Resend } from "resend";
import { VALIDITY_DAYS } from "@/lib/constants";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);
const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key_for_build");

export async function POST(req: NextRequest) {
  // BUG-01: Guard the Razorpay secret before doing anything — a missing or
  // undefined secret would make crypto.createHmac silently produce a digest
  // that any attacker could replicate, bypassing payment verification entirely.
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!razorpaySecret) {
    console.error("verify-payment: RAZORPAY_KEY_SECRET is not configured.");
    return NextResponse.json(
      { error: "Payment gateway not configured. Contact support." },
      { status: 500 }
    );
  }
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await adminAuth.verifyIdToken(token);

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, celebrationId } = body;

    // Verify HMAC signature against the pre-validated secret (BUG-01 fix).
    const expected = crypto
      .createHmac("sha256", razorpaySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    // Generate a unique slug — retry up to 5 times on collision (BUG-03 fix).
    // A single-retry approach could still produce duplicate slugs under load.
    let slug = "";
    const MAX_SLUG_ATTEMPTS = 5;
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
      const candidate = nanoid();
      const existing = await adminDb
        .collection("celebrations")
        .where("slug", "==", candidate)
        .get();
      if (existing.empty) {
        slug = candidate;
        break;
      }
      console.warn(`Slug collision on attempt ${attempt + 1}: "${candidate}"`);
    }
    if (!slug) {
      console.error("verify-payment: Failed to generate a unique slug after 5 attempts.");
      return NextResponse.json(
        { error: "Failed to generate a unique URL. Please try again." },
        { status: 500 }
      );
    }

    // Update celebration
    const now = Timestamp.now();

    const celebRef = adminDb.collection("celebrations").doc(celebrationId);
    const celebSnap = await celebRef.get();
    if (!celebSnap.exists || celebSnap.data()?.userId !== decoded.uid) {
      return NextResponse.json({ error: "Celebration not found" }, { status: 404 });
    }

    // Hosting length depends on the purchased hosting tier (default 1 year).
    const hostingFeatures: string[] = Array.isArray(celebSnap.data()?.selectedFeatures)
      ? celebSnap.data()!.selectedFeatures
      : [];
    const hostingDays = hostingFeatures.includes("hosting_lifetime")
      ? 36500 // ~100 years = effectively lifetime
      : hostingFeatures.includes("hosting_3yr")
        ? VALIDITY_DAYS * 3
        : VALIDITY_DAYS;
    const expiresAt = Timestamp.fromDate(
      new Date(Date.now() + hostingDays * 24 * 60 * 60 * 1000)
    );

    await celebRef.update({
      slug,
      razorpayPaymentId: razorpay_payment_id,
      paymentStatus: "paid",
      isActive: true,
      expiresAt,
    });

    // ── Finalize referral: credit the referrer on first successful payment ────
    // Runs only once per buyer (guarded by their `referralRedeemed` flag) and
    // only when this order actually carried a referral discount.
    try {
      const paidCeleb = celebSnap.data() as any;
      const referredByCode: string | undefined = paidCeleb?.referredBy;
      if (referredByCode && paidCeleb?.referralDiscountPaise > 0) {
        const buyerRef = adminDb.collection("users").doc(decoded.uid);
        const buyerSnap = await buyerRef.get();
        if (buyerSnap.data()?.referralRedeemed !== true) {
          await buyerRef.update({ referralRedeemed: true });
          const referrerQuery = await adminDb
            .collection("users")
            .where("referralCode", "==", referredByCode)
            .limit(1)
            .get();
          if (!referrerQuery.empty) {
            const { REFERRAL_REWARD_INR, REFERRAL_MILESTONE_COUNT } = await import("@/lib/constants");
            const referrerRef = referrerQuery.docs[0].ref;
            const newCount = (referrerQuery.docs[0].data()?.referralCount ?? 0) + 1;
            const update: Record<string, unknown> = {
              referralCredits: FieldValue.increment(REFERRAL_REWARD_INR),
              referralCount: FieldValue.increment(1),
            };
            // Milestone: every Nth successful referral grants a free add-on credit.
            if (newCount % REFERRAL_MILESTONE_COUNT === 0) {
              update.freeAddonCredits = FieldValue.increment(1);
            }
            await referrerRef.update(update);
          }
        }
      }
    } catch (e) {
      // Referral crediting must never fail the payment confirmation.
      console.error("verify-payment: referral crediting failed", e);
    }

    const celebData = celebSnap.data() as any;
    const occasion = celebData.occasionType || "birthday";
    const occasionEmoji = occasion === "anniversary" ? "💍" : occasion === "proposal" ? "💌" : occasion === "kids-birthday" ? "🧸" : "🎂";
    const occasionLabel = occasion === "anniversary" ? "Anniversary" : occasion === "proposal" ? "Proposal" : occasion === "kids-birthday" ? "Kids Birthday" : "Birthday";

    // Send confirmation email
    const birthdayUrl = `${process.env.NEXT_PUBLIC_BIRTHDAY_APP_URL}/wish/${slug}`;
    const whatsappMsg = encodeURIComponent(`${occasionEmoji} I created a beautiful ${occasionLabel.toLowerCase()} surprise website for you!\n\nVisit: ${birthdayUrl}`);
    const whatsappUrl = `https://wa.me/?text=${whatsappMsg}`;

    // The payment is already recorded — never let a missing address or a Resend
    // failure turn a successful activation into a 500. Email is best-effort.
    const recipientEmail = decoded.email;
    if (recipientEmail) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: recipientEmail,
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
        });
      } catch (emailError) {
        // Best-effort: log and continue — activation already succeeded.
        console.error("verify-payment: confirmation email failed", emailError);
      }
    }

    return NextResponse.json({ success: true, slug, url: birthdayUrl });
  } catch (error: any) {
    console.error("verify-payment error:", error);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}
