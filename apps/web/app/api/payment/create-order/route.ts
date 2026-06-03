import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { PRICE_PAISE } from "@/lib/constants";

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

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: PRICE_PAISE,
      currency: "INR",
      receipt: `bg_${celebrationId.slice(0, 10)}_${Date.now()}`,
      notes: {
        celebrationId,
        userId: decoded.uid,
      },
    });

    // Store order ID on the celebration doc
    await celebRef.update({ razorpayOrderId: order.id });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("create-order error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
