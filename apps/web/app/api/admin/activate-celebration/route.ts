import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { customAlphabet } from "nanoid";
import { COLLECTIONS, normalizeVanitySlug, VALIDITY_DAYS } from "@/lib/constants";
import { releaseCheckoutBenefits } from "@/lib/referral-server";
import { requireAdminRequest } from "@/lib/admin-session";
import { getCelebrationUrl } from "@/lib/celebration-url";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);

// Admin-only endpoint to manually activate a celebration after confirmed payment
// Usage: POST /api/admin/activate-celebration
// Body: { celebrationId, razorpayPaymentId }
async function requireAdmin(req: NextRequest): Promise<string> {
  const admin = await requireAdminRequest(req);
  return admin.uid;
}

async function reserveVanityLink(celebrationId: string, userId: string, vanitySlug: string): Promise<void> {
  if (!vanitySlug) return;

  const vanityRef = adminDb.collection("vanityLinks").doc(vanitySlug);
  await adminDb.runTransaction(async (transaction) => {
    const vanitySnapshot = await transaction.get(vanityRef);
    if (vanitySnapshot.exists && vanitySnapshot.data()?.celebrationId !== celebrationId) {
      throw new Error("CUSTOM_LINK_TAKEN");
    }
    transaction.set(vanityRef, {
      celebrationId,
      userId,
      reservedAt: vanitySnapshot.data()?.reservedAt ?? Timestamp.now(),
      activatedAt: Timestamp.now(),
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { celebrationId, razorpayPaymentId, waivePayment = false, reason } = body;
    const adminId = await requireAdmin(req);
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
    const selectedFeatures = Array.isArray(celebData.checkoutFeatures)
      ? celebData.checkoutFeatures
      : Array.isArray(celebData.selectedFeatures)
        ? celebData.selectedFeatures
        : [];
    const hasCustomLink = selectedFeatures.includes("custom_link");
    const vanitySlug = hasCustomLink
      ? normalizeVanitySlug(celebData.checkoutVanitySlug ?? celebData.vanitySlug)
      : "";

    if (hasCustomLink && vanitySlug.length < 3) {
      return NextResponse.json({ error: "Enter a valid custom link" }, { status: 400 });
    }

    if (celebData.isActive && celebData.paymentStatus === "paid") {
      await reserveVanityLink(celebrationId, celebData.userId, vanitySlug);
      if (hasLaunchAt) {
        await celebRef.update({
          launchAt: launchDate ? Timestamp.fromDate(launchDate) : null,
          launchScheduledBy: adminId,
          launchScheduleUpdatedAt: Timestamp.now(),
        });
      }
      if (vanitySlug) {
        await celebRef.update({ vanitySlug, checkoutVanitySlug: vanitySlug });
      }
      return NextResponse.json({
        success: true,
        message: hasLaunchAt ? "Launch time updated" : "Already active",
        slug: celebData.slug,
        vanitySlug,
        birthdayUrl: getCelebrationUrl(celebData.slug, vanitySlug),
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
    await reserveVanityLink(celebrationId, celebData.userId, vanitySlug);

    await celebRef.update({
      slug,
      ...(vanitySlug ? { vanitySlug, checkoutVanitySlug: vanitySlug } : {}),
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
      vanitySlug,
      birthdayUrl: getCelebrationUrl(slug, vanitySlug),
      message: `Celebration ${celebrationId} activated with slug: ${slug}`,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error?.message === "ADMIN_SESSION_REQUIRED") {
      return NextResponse.json({ error: "Admin session expired" }, { status: 401 });
    }
    if (error?.message === "CUSTOM_LINK_TAKEN") {
      return NextResponse.json({ error: "This custom link is already in use" }, { status: 409 });
    }
    console.error("Admin activate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
