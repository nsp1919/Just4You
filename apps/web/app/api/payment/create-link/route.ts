import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { PRICE_PAISE, COLLECTIONS } from "@/lib/constants";
import Razorpay from "razorpay";

// Force dynamic — this route uses env vars and must not be statically rendered
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    const { celebrationId } = await req.json();
    if (!celebrationId) {
      return NextResponse.json({ error: "celebrationId is required" }, { status: 400 });
    }

    // Verify the celebration belongs to this user
    const celebRef = adminDb.collection(COLLECTIONS.CELEBRATIONS).doc(celebrationId);
    const celebSnap = await celebRef.get();

    if (!celebSnap.exists) {
      return NextResponse.json({ error: "Celebration not found" }, { status: 404 });
    }

    const celeb = celebSnap.data() as any;
    if (celeb.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (celeb.isActive) {
      return NextResponse.json({ error: "Already paid" }, { status: 400 });
    }

    // Initialize Razorpay INSIDE the handler (not at module level)
    // so it doesn't run during Next.js build time
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://just4you.buzz";

    // Create a unique Razorpay Payment Link with celebrationId in notes
    const paymentLink = await (razorpay as any).paymentLink.create({
      amount: PRICE_PAISE,
      currency: "INR",
      accept_partial: false,
      description: `Just4You — ${celeb.recipientName}'s ${celeb.occasionType || "birthday"} website`,
      notes: {
        celebrationId: celebrationId,
        userId: userId,
      },
      callback_url: `${appUrl}/dashboard/payment-return`,
      callback_method: "get",
      notify: {
        email: false,
        sms: false,
      },
      reminder_enable: false,
    });

    return NextResponse.json({ paymentUrl: paymentLink.short_url });
  } catch (error: any) {
    console.error("Create payment link error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment link" },
      { status: 500 }
    );
  }
}
