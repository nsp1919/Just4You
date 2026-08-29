import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, SOCIAL_SHARE_REWARD_INR } from "@/lib/constants";

export const dynamic = "force-dynamic";

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().replace(/[\r\n]+/g, " ").slice(0, maxLength) : "";
}

function normalizeInstagramHandle(value: unknown): string {
  const handle = cleanText(value, 31).replace(/^@/, "").toLowerCase();
  return /^[a-z0-9._]{1,30}$/.test(handle) ? handle : "";
}

async function requireOwner(request: NextRequest, celebrationId: string) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const decoded = await adminAuth.verifyIdToken(authHeader.slice(7), true);
  const reference = adminDb.collection(COLLECTIONS.CELEBRATIONS).doc(celebrationId);
  const snapshot = await reference.get();
  if (!snapshot.exists || snapshot.data()?.userId !== decoded.uid) throw new Error("NOT_FOUND");
  return { decoded, snapshot };
}

function publicClaim(data: FirebaseFirestore.DocumentData | undefined) {
  if (!data) return null;
  return {
    instagramHandle: data.instagramHandle ?? "",
    instagramPostUrl: data.instagramPostUrl ?? "",
    status: data.status ?? "pending",
    rejectionReason: data.rejectionReason ?? "",
    submittedAt: data.submittedAt?.toDate?.().toISOString?.() ?? null,
    reviewedAt: data.reviewedAt?.toDate?.().toISOString?.() ?? null,
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const owned = await requireOwner(request, id);
    const claim = await adminDb.collection(COLLECTIONS.SOCIAL_REWARD_CLAIMS).doc(id).get();
    return NextResponse.json({
      recipientName: cleanText(owned.snapshot.data()?.recipientName, 80),
      rewardInr: SOCIAL_SHARE_REWARD_INR,
      instagramUrl: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/",
      claim: claim.exists ? publicClaim(claim.data()) : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (message === "NOT_FOUND") return NextResponse.json({ error: "Celebration not found" }, { status: 404 });
    console.error("social reward claim GET failed:", error);
    return NextResponse.json({ error: "Unable to load the Instagram reward." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const owned = await requireOwner(request, id);
    const body = await request.json().catch(() => ({}));
    const instagramHandle = normalizeInstagramHandle(body.instagramHandle);
    if (!instagramHandle || body.confirmedSent !== true || body.consentToFeature !== true) {
      return NextResponse.json({ error: "Enter your Instagram username and confirm both statements." }, { status: 400 });
    }

    const claimRef = adminDb.collection(COLLECTIONS.SOCIAL_REWARD_CLAIMS).doc(id);
    await adminDb.runTransaction(async (transaction) => {
      const claim = await transaction.get(claimRef);
      if (["pending", "approved"].includes(claim.data()?.status)) throw new Error("CLAIM_EXISTS");
      transaction.set(claimRef, {
        userId: owned.decoded.uid,
        userEmail: owned.decoded.email ?? "",
        celebrationId: id,
        recipientName: cleanText(owned.snapshot.data()?.recipientName, 80),
        instagramHandle,
        consentToFeature: true,
        confirmedSent: true,
        platform: "instagram",
        instagramPostUrl: "",
        proofUrl: "",
        rewardInr: SOCIAL_SHARE_REWARD_INR,
        status: "pending",
        submittedAt: FieldValue.serverTimestamp(),
        reviewedAt: null,
        rejectionReason: "",
      });
    });
    return NextResponse.json({ submitted: true, rewardInr: SOCIAL_SHARE_REWARD_INR }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (message === "NOT_FOUND") return NextResponse.json({ error: "Celebration not found" }, { status: 404 });
    if (message === "CLAIM_EXISTS") return NextResponse.json({ error: "A reward request already exists for this celebration." }, { status: 409 });
    console.error("social reward claim POST failed:", error);
    return NextResponse.json({ error: "Unable to submit the Instagram reward request." }, { status: 500 });
  }
}