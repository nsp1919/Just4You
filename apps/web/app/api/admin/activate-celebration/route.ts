import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { customAlphabet } from "nanoid";
import { COLLECTIONS, VALIDITY_DAYS } from "@/lib/constants";
import { releaseCheckoutBenefits } from "@/lib/referral-server";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);

// Admin-only endpoint to manually activate a celebration after confirmed payment
// Usage: POST /api/admin/activate-celebration
// Body: { celebrationId, razorpayPaymentId, adminSecret }
// Constant-time secret comparison to avoid leaking the secret via timing.
function secretsMatch(provided: unknown, expected: string | undefined): boolean {
  if (!expected || typeof provided !== "string") return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function requireAdmin(req: NextRequest, adminSecret: unknown): Promise<string> {
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    const adminSnap = await adminDb.collection(COLLECTIONS.USERS).doc(decoded.uid).get();
    if (adminSnap.data()?.role !== "admin") throw new Error("FORBIDDEN");
    return decoded.uid;
  }
  if (secretsMatch(adminSecret, process.env.ADMIN_SECRET)) return "admin-secret";
  throw new Error("UNAUTHORIZED");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { celebrationId, razorpayPaymentId, adminSecret, waivePayment = false, reason } = body;
    const adminId = await requireAdmin(req, adminSecret);
    const hasLaunchAt = Object.prototype.hasOwnProperty.call(body, "launchAt");
    const launchDate = typeof body.launchAt === "string" && body.launchAt
      ? new Date(body.launchAt)
      : null;

    if (!celebrationId) {
      return NextResponse.json({ error: "celebrationId is required" }, { status: 400 });
    }
    if (launchDate && Number.isNaN(launchDate.getTime())) {
      return NextResponse.json({ error: "Enter a valid launch date and time" }, { status: 400 });
    }
    if (!waivePayment && !razorpayPaymentId) {
      return NextResponse.json(
        { error: "razorpayPaymentId is required unless payment is explicitly waived" },
        { status: 400 },
      );
    }

    const celebRef = adminDb.collection("celebrations").doc(celebrationId);
    const celebSnap = await celebRef.get();

    if (!celebSnap.exists) {
      return NextResponse.json({ error: "Celebration not found" }, { status: 404 });
    }

    const celebData = celebSnap.data() as any;

    if (celebData.isActive && celebData.paymentStatus === "paid") {
      if (hasLaunchAt) {
        await celebRef.update({
          launchAt: launchDate ? Timestamp.fromDate(launchDate) : null,
          launchScheduledBy: adminId,
          launchScheduleUpdatedAt: Timestamp.now(),
        });
      }
      return NextResponse.json({
        success: true,
        message: hasLaunchAt ? "Launch time updated" : "Already active",
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

    const validityStartsAt = launchDate && launchDate.getTime() > Date.now() ? launchDate.getTime() : Date.now();
    const expiresAt = Timestamp.fromDate(new Date(validityStartsAt + VALIDITY_DAYS * 24 * 60 * 60 * 1000));

    if (waivePayment) {
      await releaseCheckoutBenefits(celebrationId);
    }

    await celebRef.update({
      slug,
      razorpayPaymentId: waivePayment ? "payment_waived" : razorpayPaymentId,
      paymentStatus: "paid",
      isActive: true,
      expiresAt,
      activationSource: waivePayment ? "admin_complimentary" : "admin_verified_payment",
      paymentWaived: Boolean(waivePayment),
      launchAt: launchDate ? Timestamp.fromDate(launchDate) : null,
      launchScheduledBy: adminId,
      manualActivationAt: Timestamp.now(),
      manualActivationReason: typeof reason === "string" ? reason.slice(0, 200) : "",
    });

    return NextResponse.json({
      success: true,
      slug,
      birthdayUrl: `${process.env.NEXT_PUBLIC_BIRTHDAY_APP_URL}/wish/${slug}`,
      message: `Celebration ${celebrationId} activated with slug: ${slug}`,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Admin activate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
