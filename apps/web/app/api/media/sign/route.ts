import { timingSafeEqual } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { uploadPolicyFor } from "@/lib/cloudinary-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function tokensMatch(expected: unknown, supplied: unknown): boolean {
  if (typeof expected !== "string" || typeof supplied !== "string") return false;
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length
    && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

async function authenticatedProfile(request: NextRequest) {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const decoded = await adminAuth.verifyIdToken(authorization.slice(7), true);
  const profile = await adminDb.collection(COLLECTIONS.USERS).doc(decoded.uid).get();
  if (profile.data()?.isBlocked === true) return null;
  return { uid: decoded.uid, role: profile.data()?.role };
}

async function validCollaborationInvite(value: unknown): Promise<boolean> {
  if (!value || typeof value !== "object") return false;
  const collaboration = value as Record<string, unknown>;
  if (typeof collaboration.celebrationId !== "string" || typeof collaboration.token !== "string") return false;
  const celebrationRef = adminDb.collection(COLLECTIONS.CELEBRATIONS).doc(collaboration.celebrationId);
  const [celebration, settings] = await Promise.all([
    celebrationRef.get(),
    celebrationRef.collection("collaboration").doc("settings").get(),
  ]);
  return celebration.exists
    && celebration.data()?.isBlocked !== true
    && settings.data()?.enabled === true
    && tokensMatch(settings.data()?.token, collaboration.token);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const policy = uploadPolicyFor(body.purpose);
    if (!policy) return NextResponse.json({ error: "Unsupported upload purpose." }, { status: 400 });

    if (policy.collaborationOnly) {
      if (!await validCollaborationInvite(body.collaboration)) {
        return NextResponse.json({ error: "This collaboration invite is unavailable." }, { status: 403 });
      }
    } else {
      const profile = await authenticatedProfile(request);
      if (!profile || (policy.adminOnly && profile.role !== "admin")) {
        return NextResponse.json({ error: "Unauthorized upload." }, { status: 403 });
      }
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Media uploads are not configured." }, { status: 503 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const allowedFormats = policy.formats.join(",");
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder: policy.folder, allowed_formats: allowedFormats },
      apiSecret,
    );
    return NextResponse.json({
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder: policy.folder,
      allowedFormats,
      resourceType: policy.resourceType,
    });
  } catch (error) {
    console.error("media signature failed", error);
    return NextResponse.json({ error: "Unable to authorize this upload." }, { status: 500 });
  }
}