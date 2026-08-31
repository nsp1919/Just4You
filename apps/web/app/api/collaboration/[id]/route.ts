import { randomBytes, timingSafeEqual } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";

const SETTINGS_DOC = "settings";
const MAX_CONTRIBUTIONS = 100;
const VALID_STATUSES = new Set(["approved", "rejected", "pending"]);

function getPublicAppOrigin(request: NextRequest): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return (configuredUrl || request.nextUrl.origin).replace(/\/$/, "");
}

interface ContributionInput {
  token?: unknown;
  name?: unknown;
  relationship?: unknown;
  message?: unknown;
  photoUrl?: unknown;
  voiceUrl?: unknown;
  website?: unknown;
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function validCloudinaryUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    return url.protocol === "https:"
      && url.hostname === "res.cloudinary.com"
      && (!cloudName || url.pathname.startsWith(`/${cloudName}/`));
  } catch {
    return false;
  }
}

function tokensMatch(actual: unknown, supplied: string): boolean {
  if (typeof actual !== "string" || !supplied) return false;
  const actualBuffer = Buffer.from(actual);
  const suppliedBuffer = Buffer.from(supplied);
  return actualBuffer.length === suppliedBuffer.length
    && timingSafeEqual(actualBuffer, suppliedBuffer);
}

async function getOwnedCelebration(request: NextRequest, celebrationId: string) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
  const reference = adminDb.collection(COLLECTIONS.CELEBRATIONS).doc(celebrationId);
  const snapshot = await reference.get();
  if (!snapshot.exists || snapshot.data()?.userId !== decoded.uid) return null;
  return { reference, snapshot };
}

async function getValidInvite(celebrationId: string, token: string) {
  const celebrationRef = adminDb.collection(COLLECTIONS.CELEBRATIONS).doc(celebrationId);
  const [celebrationSnapshot, settingsSnapshot] = await Promise.all([
    celebrationRef.get(),
    celebrationRef.collection("collaboration").doc(SETTINGS_DOC).get(),
  ]);
  const celebration = celebrationSnapshot.data();
  const settings = settingsSnapshot.data();
  if (
    !celebrationSnapshot.exists
    || celebration?.isBlocked === true
    || settings?.enabled !== true
    || !tokensMatch(settings.token, token)
  ) {
    return null;
  }
  return { celebrationRef, celebration };
}

function serializeContribution(document: FirebaseFirestore.QueryDocumentSnapshot) {
  const data = document.data();
  return {
    id: document.id,
    name: cleanText(data.name, 50),
    relationship: cleanText(data.relationship, 40),
    message: cleanText(data.message, 500),
    photoUrl: cleanText(data.photoUrl, 2048),
    voiceUrl: cleanText(data.voiceUrl, 2048),
    status: VALID_STATUSES.has(data.status) ? data.status : "pending",
    createdAt: data.createdAt?.toDate?.().toISOString?.() ?? null,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const publicToken = request.nextUrl.searchParams.get("token");

    if (publicToken) {
      const invite = await getValidInvite(id, publicToken);
      if (!invite) return NextResponse.json({ error: "This invite is unavailable." }, { status: 404 });
      return NextResponse.json({
        recipientName: cleanText(invite.celebration?.recipientName, 80),
        occasionType: cleanText(invite.celebration?.occasionType, 30) || "birthday",
      });
    }

    const owned = await getOwnedCelebration(request, id);
    if (!owned) return NextResponse.json({ error: "Celebration not found." }, { status: 404 });

    const [settingsSnapshot, contributionsSnapshot] = await Promise.all([
      owned.reference.collection("collaboration").doc(SETTINGS_DOC).get(),
      owned.reference.collection("contributions").limit(MAX_CONTRIBUTIONS).get(),
    ]);
    const settings = settingsSnapshot.data();
    const contributions = contributionsSnapshot.docs
      .map(serializeContribution)
      .sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""));
    const publicAppOrigin = getPublicAppOrigin(request);

    return NextResponse.json({
      recipientName: cleanText(owned.snapshot.data()?.recipientName, 80),
      occasionType: cleanText(owned.snapshot.data()?.occasionType, 30) || "birthday",
      inviteEnabled: settings?.enabled === true,
      inviteUrl: settings?.token
        ? `${publicAppOrigin}/contribute/${id}/${settings.token}`
        : null,
      contributions,
    });
  } catch (error) {
    console.error("collaboration GET failed:", error);
    return NextResponse.json({ error: "Unable to load collaboration details." }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("Authorization");

    if (authHeader?.startsWith("Bearer ")) {
      const owned = await getOwnedCelebration(request, id);
      if (!owned) return NextResponse.json({ error: "Celebration not found." }, { status: 404 });

      const token = randomBytes(24).toString("base64url");
      await owned.reference.collection("collaboration").doc(SETTINGS_DOC).set({
        token,
        enabled: true,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      return NextResponse.json({
        inviteEnabled: true,
        inviteUrl: `${getPublicAppOrigin(request)}/contribute/${id}/${token}`,
      });
    }

    const body = await request.json() as ContributionInput;
    if (cleanText(body.website, 200)) return NextResponse.json({ accepted: true });

    const token = cleanText(body.token, 100);
    const invite = await getValidInvite(id, token);
    if (!invite) return NextResponse.json({ error: "This invite is unavailable." }, { status: 404 });

    const name = cleanText(body.name, 50);
    const relationship = cleanText(body.relationship, 40);
    const message = cleanText(body.message, 500);
    const photoUrl = cleanText(body.photoUrl, 2048);
    const voiceUrl = cleanText(body.voiceUrl, 2048);
    if (!name || (!message && !photoUrl && !voiceUrl)) {
      return NextResponse.json({ error: "Add your name and at least one message or memory." }, { status: 400 });
    }
    if (!validCloudinaryUrl(photoUrl) || !validCloudinaryUrl(voiceUrl)) {
      return NextResponse.json({ error: "Uploaded media URL is invalid." }, { status: 400 });
    }

    const contributionsRef = invite.celebrationRef.collection("contributions");
    const existing = await contributionsRef.limit(MAX_CONTRIBUTIONS).get();
    if (existing.size >= MAX_CONTRIBUTIONS) {
      return NextResponse.json({ error: "This group surprise has reached its contribution limit." }, { status: 409 });
    }

    await contributionsRef.add({
      name,
      relationship,
      message,
      photoUrl,
      voiceUrl,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      reviewedAt: null,
    });
    return NextResponse.json({ accepted: true }, { status: 201 });
  } catch (error) {
    console.error("collaboration POST failed:", error);
    return NextResponse.json({ error: "Unable to save this contribution." }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const owned = await getOwnedCelebration(request, id);
    if (!owned) return NextResponse.json({ error: "Celebration not found." }, { status: 404 });

    const body = await request.json() as { contributionId?: unknown; status?: unknown; inviteEnabled?: unknown };
    if (typeof body.inviteEnabled === "boolean") {
      await owned.reference.collection("collaboration").doc(SETTINGS_DOC).set({
        enabled: body.inviteEnabled,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return NextResponse.json({ inviteEnabled: body.inviteEnabled });
    }

    const contributionId = cleanText(body.contributionId, 100);
    const status = cleanText(body.status, 20);
    if (!contributionId || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid moderation request." }, { status: 400 });
    }

    const contributionRef = owned.reference.collection("contributions").doc(contributionId);
    const contributionSnapshot = await contributionRef.get();
    if (!contributionSnapshot.exists) {
      return NextResponse.json({ error: "Contribution not found." }, { status: 404 });
    }
    await contributionRef.update({ status, reviewedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ contributionId, status });
  } catch (error) {
    console.error("collaboration PATCH failed:", error);
    return NextResponse.json({ error: "Unable to update this contribution." }, { status: 500 });
  }
}