import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";

const OCCASIONS = new Set(["birthday", "anniversary", "proposal", "kids-birthday", "graduation", "wedding", "custom"]);

function text(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().replace(/[\r\n]+/g, " ").slice(0, maxLength) : "";
}

function cloudinaryImage(value: string): string {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com" && url.pathname.includes("/image/upload/") ? url.toString() : "";
  } catch {
    return "";
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    const body = await request.json().catch(() => ({}));
    const action = body.action === "disable" || body.action === "complete" ? body.action : "sync";
    const reference = adminDb.collection(COLLECTIONS.DRAFT_RECOVERIES).doc(decoded.uid);

    if (action === "disable" || action === "complete") {
      await reference.set({ optedIn: false, completed: action === "complete", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return NextResponse.json({ saved: true });
    }

    const recipientName = text(body.recipientName, 80);
    const occasionType = text(body.occasionType, 30);
    const theme = text(body.theme, 30);
    const photoUrl = cloudinaryImage(text(body.photoUrl, 2048));
    const celebrationId = text(body.celebrationId, 100);
    const step = Math.max(0, Math.min(5, Math.floor(Number(body.step) || 0)));
    if (!recipientName || !OCCASIONS.has(occasionType) || body.consent !== true) {
      return NextResponse.json({ error: "Recovery consent and draft details are required." }, { status: 400 });
    }

    await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      const existing = snapshot.data();
      const startsNewRecovery = existing?.completed === true || (celebrationId && existing?.celebrationId && celebrationId !== existing.celebrationId);
      transaction.set(reference, {
        userId: decoded.uid,
        email: decoded.email ?? "",
        recipientName,
        occasionType,
        theme,
        photoUrl,
        celebrationId,
        step,
        resumeUrl: "/dashboard/create?resume=1",
        optedIn: true,
        completed: false,
        updatedAt: FieldValue.serverTimestamp(),
        ...(startsNewRecovery ? { reminderSentAt: FieldValue.delete(), reminderClaimedAt: FieldValue.delete() } : {}),
      }, { merge: true });
    });
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("draft recovery sync failed:", error);
    return NextResponse.json({ error: "Unable to sync recovery preferences." }, { status: 500 });
  }
}