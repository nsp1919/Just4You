import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { customAlphabet } from "nanoid";
import { Resend } from "resend";
import { VALIDITY_DAYS } from "@/lib/constants";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);
const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key_for_build");

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("verify-webhook: RAZORPAY_WEBHOOK_SECRET is not configured.");
    return NextResponse.json(
      { error: "Webhook signature secret is not configured." },
      { status: 500 }
    );
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      console.warn("verify-webhook: Missing x-razorpay-signature header.");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify signature using the secret configured in Razorpay Dashboard
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.warn("verify-webhook: Signature verification failed.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const body = JSON.parse(rawBody);

    // We specifically want to process payment.captured event
    if (body.event === "payment.captured") {
      const payment = body.payload.payment.entity;
      const celebrationId = payment.notes?.celebrationId;

      if (!celebrationId) {
        console.warn("verify-webhook: payment.captured event received, but missing notes.celebrationId.");
        return NextResponse.json({ success: true, message: "No celebrationId note found" });
      }

      console.log(`verify-webhook: Processing successful payment for celebration ${celebrationId}`);

      const celebRef = adminDb.collection("celebrations").doc(celebrationId);
      const celebSnap = await celebRef.get();

      if (!celebSnap.exists) {
        console.error(`verify-webhook: Celebration ${celebrationId} not found in database.`);
        return NextResponse.json({ error: "Celebration not found" }, { status: 404 });
      }

      const celebData = celebSnap.data() as any;

      // Avoid double-processing if already paid
      if (celebData.paymentStatus === "paid" && celebData.isActive) {
        console.log(`verify-webhook: Celebration ${celebrationId} is already marked as paid.`);
        return NextResponse.json({ success: true, message: "Already processed" });
      }

      // Generate unique slug with collision check (up to 5 attempts)
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
        console.warn(`verify-webhook: Slug collision on attempt ${attempt + 1}: "${candidate}"`);
      }

      if (!slug) {
        console.error("verify-webhook: Failed to generate a unique slug after 5 attempts.");
        return NextResponse.json({ error: "Slug generation collision" }, { status: 500 });
      }

      // Update Firestore document details
      const expiresAt = Timestamp.fromDate(
        new Date(Date.now() + VALIDITY_DAYS * 24 * 60 * 60 * 1000)
      );

      await celebRef.update({
        slug,
        razorpayPaymentId: payment.id,
        paymentStatus: "paid",
        isActive: true,
        expiresAt,
      });

      console.log(`verify-webhook: Celebration ${celebrationId} updated successfully with slug: ${slug}`);

      // Attempt to retrieve user's email via adminAuth using the userId
      let userEmail = payment.email; // fallback to customer email from payment payload
      try {
        if (celebData.userId) {
          const userRecord = await adminAuth.getUser(celebData.userId);
          if (userRecord.email) {
            userEmail = userRecord.email;
          }
        }
      } catch (authError) {
        console.error(`verify-webhook: Failed to retrieve user email for userId ${celebData.userId}:`, authError);
      }

      if (userEmail) {
        const occasion = celebData.occasionType || "birthday";
        const occasionEmoji = occasion === "anniversary" ? "💍" : occasion === "proposal" ? "💌" : occasion === "kids-birthday" ? "🧸" : "🎂";
        const occasionLabel = occasion === "anniversary" ? "Anniversary" : occasion === "proposal" ? "Proposal" : occasion === "kids-birthday" ? "Kids Birthday" : "Birthday";

        const birthdayUrl = `${process.env.NEXT_PUBLIC_BIRTHDAY_APP_URL}/wish/${slug}`;
        const whatsappMsg = encodeURIComponent(`${occasionEmoji} I created a beautiful ${occasionLabel.toLowerCase()} surprise website for you!\n\nVisit: ${birthdayUrl}`);
        const whatsappUrl = `https://wa.me/?text=${whatsappMsg}`;

        try {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL!,
            to: userEmail,
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
          console.log(`verify-webhook: Resend email successfully dispatched to ${userEmail}`);
        } catch (emailError) {
          console.error("verify-webhook: Failed to send confirmation email via Resend:", emailError);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("verify-webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
