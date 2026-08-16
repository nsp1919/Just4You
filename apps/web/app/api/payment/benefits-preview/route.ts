import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { previewCheckoutBenefits } from "@/lib/referral-server";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    const { celebrationId } = await req.json();
    if (!celebrationId) {
      return NextResponse.json({ error: "Missing celebrationId" }, { status: 400 });
    }

    const celebSnap = await adminDb.collection(COLLECTIONS.CELEBRATIONS).doc(celebrationId).get();
    if (!celebSnap.exists || celebSnap.data()?.userId !== decoded.uid) {
      return NextResponse.json({ error: "Celebration not found" }, { status: 404 });
    }

    const celebration = celebSnap.data()!;
    const features = Array.isArray(celebration.selectedFeatures) ? celebration.selectedFeatures : [];
    const benefits = await previewCheckoutBenefits(decoded.uid, celebrationId, features);

    return NextResponse.json(benefits);
  } catch (error: any) {
    const status = error?.message === "ALREADY_PAID" ? 409 : 500;
    console.error("benefits-preview error:", error);
    return NextResponse.json({ error: "Unable to calculate checkout benefits." }, { status });
  }
}