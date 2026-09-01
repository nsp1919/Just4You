import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, FEATURE_ADDONS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 256 * 1024;
const OCCASIONS = new Set(["birthday", "anniversary", "proposal", "kids-birthday", "graduation", "wedding", "custom"]);
const THEMES = new Set(["galaxy", "floral", "neon", "minimal", "retro", "magical"]);
const FEATURE_IDS = new Set(FEATURE_ADDONS.map((feature) => feature.id));
const DRAFT_FIELDS = new Set([
  "recipientName", "birthdayDate", "eventDate", "message", "theme", "relation",
  "relationCustom", "occasionType", "weddingData", "photos", "countdownEnabled",
  "isPublicOptIn", "scheduledDeliveryAt", "recipientEmail", "deliveredAt",
  "vanitySlug", "musicType", "musicPresetId", "musicUploadUrl", "voiceMessageUrl",
  "videoMessageUrl", "selectedFeatures", "weddingPricing",
]);

function text(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function validMediaUrl(value: unknown): boolean {
  if (value === "" || value == null) return true;
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    return url.protocol === "https:"
      && url.hostname === "res.cloudinary.com"
      && Boolean(cloudName && url.pathname.startsWith(`/${cloudName}/`));
  } catch {
    return false;
  }
}

function sanitizeDraft(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("INVALID_DRAFT");
  const input = value as Record<string, unknown>;
  const occasionType = text(input.occasionType, 30);
  const theme = text(input.theme, 30);
  const recipientName = text(input.recipientName, 80);
  const message = text(input.message, 500);
  if (!OCCASIONS.has(occasionType) || !THEMES.has(theme) || !recipientName || !message) {
    throw new Error("INVALID_DRAFT");
  }

  const photos = Array.isArray(input.photos)
    ? input.photos.filter((photo): photo is string => typeof photo === "string" && validMediaUrl(photo)).slice(0, 25)
    : [];
  if (!Array.isArray(input.photos) || photos.length !== input.photos.length) throw new Error("INVALID_MEDIA");
  for (const field of ["musicUploadUrl", "voiceMessageUrl", "videoMessageUrl"] as const) {
    if (!validMediaUrl(input[field])) throw new Error("INVALID_MEDIA");
  }

  const selectedFeatures = Array.isArray(input.selectedFeatures)
    ? [...new Set(input.selectedFeatures.filter((feature): feature is string => typeof feature === "string" && FEATURE_IDS.has(feature as never)))]
    : [];
  const draft: Record<string, unknown> = {};
  for (const [key, fieldValue] of Object.entries(input)) {
    if (DRAFT_FIELDS.has(key)) draft[key] = fieldValue;
  }
  return {
    ...draft,
    recipientName,
    message,
    occasionType,
    theme,
    photos,
    selectedFeatures,
    galleryApproved: false,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: "Draft is too large." }, { status: 413 });
    }

    const decoded = await adminAuth.verifyIdToken(authorization.slice(7), true);
    const rawBody = await request.text();
    if (rawBody.length > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: "Draft is too large." }, { status: 413 });
    }
    const body = JSON.parse(rawBody) as { celebrationId?: unknown; draft?: unknown };
    const requestedId = text(body.celebrationId, 100);
    const draft = sanitizeDraft(body.draft);
    const requestedRef = requestedId
      ? adminDb.collection(COLLECTIONS.CELEBRATIONS).doc(requestedId)
      : null;
    const newRef = adminDb.collection(COLLECTIONS.CELEBRATIONS).doc();

    const result = await adminDb.runTransaction(async (transaction) => {
      const requestedSnapshot = requestedRef ? await transaction.get(requestedRef) : null;
      const existing = requestedSnapshot?.data();
      const canUpdate = requestedSnapshot?.exists
        && existing?.userId === decoded.uid
        && existing?.paymentStatus !== "paid"
        && existing?.isActive !== true;

      if (canUpdate && requestedRef) {
        transaction.update(requestedRef, draft);
        return { celebrationId: requestedRef.id, created: false, replacedStaleDraft: false };
      }

      transaction.create(newRef, {
        ...draft,
        userId: decoded.uid,
        paymentStatus: "pending",
        isActive: false,
        isBlocked: false,
        views: 0,
        razorpayOrderId: "",
        slug: "",
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: null,
      });
      return { celebrationId: newRef.id, created: true, replacedStaleDraft: Boolean(requestedId) };
    });

    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof Error && ["INVALID_DRAFT", "INVALID_MEDIA"].includes(error.message))) {
      return NextResponse.json({ error: "Celebration details are invalid. Review the form and try again." }, { status: 400 });
    }
    console.error("celebration draft save failed", error);
    return NextResponse.json({ error: "Unable to save this celebration." }, { status: 500 });
  }
}