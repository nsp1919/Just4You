import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { customAlphabet } from "nanoid";
import { VALIDITY_DAYS } from "@/lib/constants";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);

// Admin-only endpoint to manually activate a celebration after confirmed payment
// Usage: POST /api/admin/activate-celebration
// Body: { celebrationId, razorpayPaymentId, adminSecret }
export async function POST(req: NextRequest) {
  try {
    const { celebrationId, razorpayPaymentId, adminSecret } = await req.json();

    // Simple secret check to prevent unauthorized use
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!celebrationId) {
      return NextResponse.json({ error: "celebrationId is required" }, { status: 400 });
    }

    const celebRef = adminDb.collection("celebrations").doc(celebrationId);
    const celebSnap = await celebRef.get();

    if (!celebSnap.exists) {
      return NextResponse.json({ error: "Celebration not found" }, { status: 404 });
    }

    const celebData = celebSnap.data() as any;

    if (celebData.isActive && celebData.paymentStatus === "paid") {
      return NextResponse.json({
        success: true,
        message: "Already active",
        slug: celebData.slug,
      });
    }

    // Generate unique slug
    let slug = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = nanoid();
      const existing = await adminDb
        .collection("celebrations")
        .where("slug", "==", candidate)
        .get();
      if (existing.empty) {
        slug = candidate;
        break;
      }
    }

    if (!slug) {
      return NextResponse.json({ error: "Could not generate unique slug" }, { status: 500 });
    }

    const expiresAt = Timestamp.fromDate(
      new Date(Date.now() + VALIDITY_DAYS * 24 * 60 * 60 * 1000)
    );

    await celebRef.update({
      slug,
      razorpayPaymentId: razorpayPaymentId || "manual_activation",
      paymentStatus: "paid",
      isActive: true,
      expiresAt,
    });

    return NextResponse.json({
      success: true,
      slug,
      birthdayUrl: `${process.env.NEXT_PUBLIC_BIRTHDAY_APP_URL}/wish/${slug}`,
      message: `Celebration ${celebrationId} activated with slug: ${slug}`,
    });
  } catch (error: any) {
    console.error("Admin activate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
