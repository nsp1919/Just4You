import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { reserveCheckoutBenefits, releaseCheckoutBenefits } from "@/lib/referral-server";

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

  const requestOrigin = req.headers.get("origin") || req.nextUrl.origin;
  let requestHostname = "";
  try {
    requestHostname = new URL(requestOrigin).hostname;
  } catch {
    requestHostname = req.nextUrl.hostname;
  }
  const isLocalRequest = requestHostname === "localhost"
    || requestHostname === "127.0.0.1"
    || requestHostname === "::1";
  if (keyId.startsWith("rzp_live_") && isLocalRequest) {
    return NextResponse.json(
      { error: "Live payments cannot be tested from localhost. Use Razorpay test keys locally, or open checkout on https://just4you.buzz." },
      { status: 403 }
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

    const celebFeatures: string[] = Array.isArray(celebSnap.data()?.selectedFeatures)
      ? celebSnap.data()!.selectedFeatures
      : [];
    let existingReservation = celebSnap.data()?.referralBenefitsStatus === "reserved";
    if (existingReservation && celebSnap.data()?.paymentStatus === "failed") {
      await releaseCheckoutBenefits(
        celebrationId,
        celebSnap.data()?.referralBenefitReservationId,
      );
      existingReservation = false;
    }
    if (existingReservation && celebSnap.data()?.razorpayOrderId) {
      return NextResponse.json({
        orderId: celebSnap.data()!.razorpayOrderId,
        amount: celebSnap.data()!.chargedPaise,
        currency: "INR",
        referralDiscountPaise: celebSnap.data()!.referralDiscountPaise ?? 0,
        walletAppliedInr: celebSnap.data()!.walletAppliedInr ?? celebSnap.data()!.referralCreditAppliedInr ?? 0,
        freeAddonFeatureId: celebSnap.data()!.freeAddonFeatureId ?? null,
        freeAddonDiscountPaise: celebSnap.data()!.freeAddonDiscountPaise ?? 0,
        keyId,
      });
    }
    let benefits;
    try {
      benefits = await reserveCheckoutBenefits(decoded.uid, celebrationId, celebFeatures);
    } catch (error: any) {
      if (error?.message === "CUSTOM_LINK_TAKEN") {
        return NextResponse.json({ error: "That custom link is already taken. Choose another name." }, { status: 409 });
      }
      if (error?.message === "INVALID_CUSTOM_LINK") {
        return NextResponse.json({ error: "Enter a custom link containing at least 3 letters or numbers." }, { status: 400 });
      }
      const status = error?.message === "CHECKOUT_ALREADY_PENDING" ? 409 : 400;
      return NextResponse.json({ error: "Unable to reserve checkout. Please review your selections and try again." }, { status });
    }

    let order;
    try {
      order = await razorpay.orders.create({
        amount: benefits.amountPaise,
        currency: "INR",
        receipt: `bg_${celebrationId.slice(0, 10)}_${Date.now()}`,
        notes: { celebrationId, userId: decoded.uid },
      });
    } catch (error) {
      await releaseCheckoutBenefits(celebrationId, benefits.reservationId);
      throw error;
    }

    try {
      await celebRef.update({ razorpayOrderId: order.id });
    } catch (error) {
      await releaseCheckoutBenefits(celebrationId, benefits.reservationId);
      throw error;
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      referralDiscountPaise: benefits.referralDiscountPaise,
      walletAppliedInr: benefits.walletAppliedInr,
      freeAddonFeatureId: benefits.freeAddonFeatureId,
      freeAddonDiscountPaise: benefits.freeAddonDiscountPaise,
      keyId,
    });
  } catch (error: any) {
    console.error("create-order error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
