import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { fulfillCelebrationPayment } from "@/lib/payment-fulfillment";
import { verifyRazorpayPaymentSignature } from "@/lib/payment-signatures";

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

    if (!verifyRazorpayPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, razorpaySecret)) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    const celebRef = adminDb.collection("celebrations").doc(celebrationId);
    const celebSnap = await celebRef.get();
    if (!celebSnap.exists || celebSnap.data()?.userId !== decoded.uid) {
      return NextResponse.json({ error: "Celebration not found" }, { status: 404 });
    }
    if (!celebSnap.data()?.razorpayOrderId || celebSnap.data()?.razorpayOrderId !== razorpay_order_id) {
      return NextResponse.json({ error: "Payment does not match this celebration" }, { status: 400 });
    }
    const fulfillment = await fulfillCelebrationPayment(
      celebrationId,
      razorpay_payment_id,
      decoded.email,
    );
    return NextResponse.json({ success: true, ...fulfillment });
  } catch (error: any) {
    console.error("verify-payment error:", error);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}
