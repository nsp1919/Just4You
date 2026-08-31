import { Timestamp } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

async function authenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  return adminAuth.verifyIdToken(authHeader.slice(7));
}

function serializeRequest(document: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot) {
  const data = document.data() ?? {};
  return {
    id: document.id,
    celebrationId: data.celebrationId,
    occasionType: data.occasionType,
    status: data.status,
    currentValues: data.currentValues ?? {},
    requestedValues: data.requestedValues ?? {},
    adminNote: data.adminNote ?? "",
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
    processedAt: data.processedAt?.toDate?.()?.toISOString() ?? null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticatedUser(request);
    const snapshot = await adminDb.collection(COLLECTIONS.CELEBRATION_EDIT_REQUESTS).where("userId", "==", user.uid).get();
    const requests = snapshot.docs
      .map(serializeRequest)
      .sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""));
    return NextResponse.json({ requests });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("celebration edit requests GET failed:", error);
    return NextResponse.json({ error: "Unable to load edit requests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticatedUser(request);
    const body = await request.json().catch(() => ({}));
    const celebrationId = cleanText(body.celebrationId, 100);
    const requestedEventDate = cleanText(body.eventDate, 10);
    if (!celebrationId || !validDate(requestedEventDate)) {
      return NextResponse.json({ error: "Choose a valid event date" }, { status: 400 });
    }

    const celebrationRef = adminDb.collection(COLLECTIONS.CELEBRATIONS).doc(celebrationId);
    const editRequestRef = adminDb.collection(COLLECTIONS.CELEBRATION_EDIT_REQUESTS).doc(celebrationId);

    await adminDb.runTransaction(async (transaction) => {
      const [celebrationSnapshot, existingRequestSnapshot] = await Promise.all([
        transaction.get(celebrationRef),
        transaction.get(editRequestRef),
      ]);
      const celebration = celebrationSnapshot.data();
      if (!celebrationSnapshot.exists || celebration?.userId !== user.uid) throw new Error("CELEBRATION_NOT_FOUND");
      if (celebration?.isActive !== true) throw new Error("ACTIVE_CELEBRATION_REQUIRED");
      if (existingRequestSnapshot.data()?.status === "pending") throw new Error("EDIT_REQUEST_PENDING");

      const occasionType = cleanText(celebration.occasionType, 30) || "birthday";
      const currentEventDate = cleanText(celebration.eventDate || celebration.birthdayDate, 10);
      let currentValues: Record<string, string>;
      let requestedValues: Record<string, string>;

      if (occasionType === "wedding") {
        const partnerOne = cleanText(body.partnerOne, 80);
        const partnerTwo = cleanText(body.partnerTwo, 80);
        if (partnerOne.length < 2 || partnerTwo.length < 2) throw new Error("INVALID_NAMES");
        currentValues = {
          partnerOne: cleanText(celebration.weddingData?.couple?.partnerOne, 80),
          partnerTwo: cleanText(celebration.weddingData?.couple?.partnerTwo, 80),
          eventDate: currentEventDate,
        };
        requestedValues = { partnerOne, partnerTwo, eventDate: requestedEventDate };
      } else {
        const recipientName = cleanText(body.recipientName, 80);
        if (recipientName.length < 2) throw new Error("INVALID_NAMES");
        currentValues = {
          recipientName: cleanText(celebration.recipientName, 80),
          eventDate: currentEventDate,
        };
        requestedValues = { recipientName, eventDate: requestedEventDate };
      }

      if (JSON.stringify(currentValues) === JSON.stringify(requestedValues)) throw new Error("NO_CHANGES");
      transaction.set(editRequestRef, {
        celebrationId,
        userId: user.uid,
        userEmail: user.email ?? celebration.userEmail ?? "",
        occasionType,
        status: "pending",
        currentValues,
        requestedValues,
        createdAt: Timestamp.now(),
        processedAt: null,
        processedBy: null,
        adminNote: "",
      });
    });

    const saved = await editRequestRef.get();
    return NextResponse.json({ request: serializeRequest(saved) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const knownErrors: Record<string, { error: string; status: number }> = {
      UNAUTHORIZED: { error: "Unauthorized", status: 401 },
      CELEBRATION_NOT_FOUND: { error: "Celebration not found", status: 404 },
      ACTIVE_CELEBRATION_REQUIRED: { error: "Only active websites can request Admin edits", status: 400 },
      EDIT_REQUEST_PENDING: { error: "An edit request is already awaiting Admin review", status: 409 },
      INVALID_NAMES: { error: "Enter valid names", status: 400 },
      NO_CHANGES: { error: "Change the name or date before sending the request", status: 400 },
    };
    if (knownErrors[message]) return NextResponse.json({ error: knownErrors[message].error }, { status: knownErrors[message].status });
    console.error("celebration edit request POST failed:", error);
    return NextResponse.json({ error: "Unable to send edit request" }, { status: 500 });
  }
}
