import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, SOCIAL_SHARE_REWARD_INR } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_RECORDINGS_PER_CELEBRATION = 10;

function text(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isCloudinaryUrl(value: string, resourceType?: "image" | "video"): boolean {
  try {
    const url = new URL(value);
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    return url.protocol === "https:"
      && url.hostname === "res.cloudinary.com"
      && (!cloudName || url.pathname.startsWith(`/${cloudName}/`))
      && (!resourceType || url.pathname.includes(`/${resourceType}/upload/`));
  } catch {
    return false;
  }
}

function allowedOrigin(request: NextRequest): string {
  const origin = request.headers.get("origin") ?? "";
  const allowed = new Set([
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_BIRTHDAY_APP_URL,
    process.env.NEXT_PUBLIC_MAIN_APP_URL,
  ].filter(Boolean));
  if (/^http:\/\/localhost:\d+$/.test(origin) || allowed.has(origin)) return origin;
  return "";
}

function response(request: NextRequest, body: unknown, status = 200): NextResponse {
  const origin = allowedOrigin(request);
  return NextResponse.json(body, {
    status,
    headers: {
      ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      Vary: "Origin",
    },
  });
}

async function requireOwner(request: NextRequest, celebrationId: string) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
  const reference = adminDb.collection(COLLECTIONS.CELEBRATIONS).doc(celebrationId);
  const snapshot = await reference.get();
  if (!snapshot.exists || snapshot.data()?.userId !== decoded.uid) throw new Error("NOT_FOUND");
  return { decoded, reference, snapshot };
}

function serializeRecording(document: FirebaseFirestore.QueryDocumentSnapshot) {
  const data = document.data();
  return {
    id: document.id,
    name: text(data.name, 50),
    videoUrl: text(data.videoUrl, 2048),
    consentToShare: data.consentToShare === true,
    status: data.status === "hidden" ? "hidden" : "available",
    createdAt: data.createdAt?.toDate?.().toISOString?.() ?? null,
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = allowedOrigin(request);
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      Vary: "Origin",
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      const celebrationSnapshot = await adminDb.collection(COLLECTIONS.CELEBRATIONS).doc(id).get();
      const celebration = celebrationSnapshot.data();
      if (!celebrationSnapshot.exists || celebration?.isActive !== true || celebration?.isBlocked === true) {
        return response(request, { error: "This surprise is unavailable." }, 404);
      }
      return response(request, {
        recipientName: text(celebration?.recipientName, 80),
        eligible: true,
      });
    }

    const owned = await requireOwner(request, id);
    const [recordingsSnapshot, claimSnapshot] = await Promise.all([
      owned.reference.collection("reactionRecordings").limit(MAX_RECORDINGS_PER_CELEBRATION).get(),
      adminDb.collection(COLLECTIONS.SOCIAL_REWARD_CLAIMS).doc(id).get(),
    ]);
    const recordings = recordingsSnapshot.docs
      .map(serializeRecording)
      .sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""));
    const claim = claimSnapshot.data();

    return response(request, {
      recipientName: text(owned.snapshot.data()?.recipientName, 80),
      recordings,
      rewardInr: SOCIAL_SHARE_REWARD_INR,
      claim: claimSnapshot.exists ? {
        platform: claim?.platform,
        status: claim?.status,
        proofUrl: claim?.proofUrl,
        rejectionReason: claim?.rejectionReason ?? "",
        submittedAt: claim?.submittedAt?.toDate?.().toISOString?.() ?? null,
      } : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED") return response(request, { error: "Unauthorized" }, 401);
    if (message === "NOT_FOUND") return response(request, { error: "Celebration not found" }, 404);
    console.error("reaction recordings GET failed:", error);
    return response(request, { error: "Unable to load reaction recordings." }, 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const authHeader = request.headers.get("Authorization");

    if (authHeader?.startsWith("Bearer ")) {
      const owned = await requireOwner(request, id);
      const recordingId = text(body.recordingId, 100);
      const platform = body.platform === "instagram" || body.platform === "whatsapp" ? body.platform : "";
      const proofUrl = text(body.proofUrl, 2048);
      if (!recordingId || !platform || !proofUrl) {
        return response(request, { error: "Recording, platform, and posting proof are required." }, 400);
      }
      if (platform === "instagram") {
        try {
          const proof = new URL(proofUrl);
          if (proof.protocol !== "https:" || !/(^|\.)instagram\.com$/.test(proof.hostname)) {
            return response(request, { error: "Enter a valid public Instagram post or Reel URL." }, 400);
          }
        } catch {
          return response(request, { error: "Enter a valid public Instagram post or Reel URL." }, 400);
        }
      } else if (!isCloudinaryUrl(proofUrl, "image")) {
        return response(request, { error: "Upload a WhatsApp Status screenshot as proof." }, 400);
      }

      const claimRef = adminDb.collection(COLLECTIONS.SOCIAL_REWARD_CLAIMS).doc(id);
      const recordingRef = owned.reference.collection("reactionRecordings").doc(recordingId);
      await adminDb.runTransaction(async (transaction) => {
        const [claimSnapshot, recordingSnapshot] = await Promise.all([
          transaction.get(claimRef),
          transaction.get(recordingRef),
        ]);
        if (!recordingSnapshot.exists || recordingSnapshot.data()?.consentToShare !== true) {
          throw new Error("RECORDING_NOT_FOUND");
        }
        const existingStatus = claimSnapshot.data()?.status;
        if (existingStatus === "pending" || existingStatus === "approved") {
          throw new Error("CLAIM_EXISTS");
        }
        transaction.set(claimRef, {
          userId: owned.decoded.uid,
          userEmail: owned.decoded.email ?? "",
          celebrationId: id,
          recipientName: text(owned.snapshot.data()?.recipientName, 80),
          recordingId,
          reactionVideoUrl: recordingSnapshot.data()?.videoUrl,
          platform,
          proofUrl,
          rewardInr: SOCIAL_SHARE_REWARD_INR,
          status: "pending",
          submittedAt: FieldValue.serverTimestamp(),
          reviewedAt: null,
          rejectionReason: "",
        });
      });
      return response(request, { submitted: true, rewardInr: SOCIAL_SHARE_REWARD_INR }, 201);
    }

    if (!allowedOrigin(request)) {
      return response(request, { error: "Reaction submissions are only accepted from Just4You." }, 403);
    }
    const videoUrl = text(body.videoUrl, 2048);
    const name = text(body.name, 50);
    if (body.consentToShare !== true || !videoUrl || !isCloudinaryUrl(videoUrl, "video")) {
      return response(request, { error: "A valid reaction video and sharing consent are required." }, 400);
    }
    const celebrationRef = adminDb.collection(COLLECTIONS.CELEBRATIONS).doc(id);
    const celebrationSnapshot = await celebrationRef.get();
    const celebration = celebrationSnapshot.data();
    if (!celebrationSnapshot.exists || celebration?.isActive !== true || celebration?.isBlocked === true) {
      return response(request, { error: "This surprise is unavailable." }, 404);
    }

    const recordingsRef = celebrationRef.collection("reactionRecordings");
    const existing = await recordingsRef.limit(MAX_RECORDINGS_PER_CELEBRATION).get();
    if (existing.size >= MAX_RECORDINGS_PER_CELEBRATION) {
      return response(request, { error: "This surprise has reached its reaction limit." }, 409);
    }
    await recordingsRef.add({
      name: name || "The recipient",
      videoUrl,
      consentToShare: true,
      status: "available",
      createdAt: FieldValue.serverTimestamp(),
    });
    return response(request, { accepted: true }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED") return response(request, { error: "Unauthorized" }, 401);
    if (message === "NOT_FOUND") return response(request, { error: "Celebration not found" }, 404);
    if (message === "RECORDING_NOT_FOUND") return response(request, { error: "Reaction recording not found." }, 404);
    if (message === "CLAIM_EXISTS") return response(request, { error: "A reward claim already exists for this celebration." }, 409);
    console.error("reaction recordings POST failed:", error);
    return response(request, { error: "Unable to save the reaction or reward claim." }, 500);
  }
}