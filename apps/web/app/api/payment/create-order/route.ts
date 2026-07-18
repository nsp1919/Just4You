import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { PRICE_PAISE, REFERRAL_DISCOUNT_INR, computePricePaise } from "@/lib/constants";

export async function POST(req: NextRequest) {
  // Guard missing credentials at route entry — same principle as verify/route.ts BUG-01 fix.
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    console.error("create-order: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured.");
    return NextResponse.json(
      { error: "Payment gateway not configured. Contact support." },
      { status: 500 }
    );
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  try {
    // Verify Firebase auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await adminAuth.verifyIdToken(token);

    const body = await req.json();
    const { celebrationId } = body;

    if (!celebrationId) {
      return NextResponse.json({ error: "Missing celebrationId" }, { status: 400 });
    }

    // Verify the celebration belongs to this user
    const celebRef = adminDb.collection("celebrations").doc(celebrationId);
    const celebSnap = await celebRef.get();
    if (!celebSnap.exists || celebSnap.data()?.userId !== decoded.uid) {
      return NextResponse.json({ error: "Celebration not found" }, { status: 404 });
    }

    // BUG-13: block re-ordering for already-paid celebrations to prevent double-charging.
    if (celebSnap.data()?.paymentStatus === "paid") {
      return NextResponse.json(
        { error: "This celebration has already been paid for." },
        { status: 409 }
      );
    }

    // ── Referral discount (server-authoritative) ──────────────────────────────
    // A referred user gets ₹REFERRAL_DISCOUNT_INR off their FIRST paid surprise.
    // Eligibility is validated here (never trusted from the client) to prevent
    // abuse: the user must have a `referredBy`, must not have redeemed before,
    // and must not already own a paid celebration.
    //
    // The base amount is derived from the persisted feature selection, never a
    // client-supplied price.
    const celebFeatures: string[] = Array.isArray(celebSnap.data()?.selectedFeatures)
      ? celebSnap.data()!.selectedFeatures
      : [];
    const basePaise = computePricePaise(celebFeatures) || PRICE_PAISE;
    let amountPaise = basePaise;
    let referralDiscountPaise = 0;
    let referredBy: string | undefined;
    try {
      const userSnap = await adminDb.collection("users").doc(decoded.uid).get();
      const userData = userSnap.data();
      referredBy = userData?.referredBy;
      const alreadyRedeemed = userData?.referralRedeemed === true;

      if (referredBy && !alreadyRedeemed) {
        const paidSnap = await adminDb
          .collection("celebrations")
          .where("userId", "==", decoded.uid)
          .where("paymentStatus", "==", "paid")
          .limit(1)
          .get();
        if (paidSnap.empty) {
          const discount = REFERRAL_DISCOUNT_INR * 100;
          // Clamp so the charged amount never drops below Razorpay's ₹1 minimum.
          referralDiscountPaise = Math.min(discount, Math.max(0, basePaise - 100));
          amountPaise = basePaise - referralDiscountPaise;
        }
      }
    } catch (e) {
      console.error("create-order: referral eligibility check failed", e);
      // Fail safe to full price rather than blocking the purchase.
      amountPaise = basePaise;
      referralDiscountPaise = 0;
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `bg_${celebrationId.slice(0, 10)}_${Date.now()}`,
      notes: {
        celebrationId,
        userId: decoded.uid,
      },
    });

    // Store order ID (and any applied referral discount) on the celebration doc
    await celebRef.update({
      razorpayOrderId: order.id,
      pricePaise: basePaise,
      ...(referralDiscountPaise > 0 ? { referralDiscountPaise, referredBy: referredBy ?? "" } : {}),
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      referralDiscountPaise,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("create-order error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
