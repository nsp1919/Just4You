import { Timestamp } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-session";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

function serializeRequest(document: FirebaseFirestore.QueryDocumentSnapshot) {
  const data = document.data();
  return {
    id: document.id,
    celebrationId: data.celebrationId,
    userEmail: data.userEmail ?? "",
    occasionType: data.occasionType,
    status: data.status,
    currentValues: data.currentValues ?? {},
    requestedValues: data.requestedValues ?? {},
    adminNote: data.adminNote ?? "",
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
    processedAt: data.processedAt?.toDate?.()?.toISOString() ?? null,
  };
}

function errorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "";
  const knownErrors: Record<string, { error: string; status: number }> = {
    UNAUTHORIZED: { error: "Admin session required", status: 401 },
    ADMIN_SESSION_REQUIRED: { error: "Admin session required", status: 401 },
    FORBIDDEN: { error: "Forbidden", status: 403 },
    EDIT_REQUEST_NOT_FOUND: { error: "Edit request not found", status: 404 },
    EDIT_REQUEST_PROCESSED: { error: "Edit request has already been processed", status: 409 },
    CELEBRATION_NOT_FOUND: { error: "Celebration not found", status: 404 },
  };
  if (knownErrors[message]) return NextResponse.json({ error: knownErrors[message].error }, { status: knownErrors[message].status });
  console.error("admin celebration edit requests failed:", error);
  return NextResponse.json({ error: "Unable to process edit request" }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminRequest(request);
    const snapshot = await adminDb.collection(COLLECTIONS.CELEBRATION_EDIT_REQUESTS).orderBy("createdAt", "desc").limit(200).get();
    return NextResponse.json({ requests: snapshot.docs.map(serializeRequest) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminRequest(request);
    const body = await request.json().catch(() => ({}));
    const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";
    const action = body.action === "approved" || body.action === "rejected" ? body.action : "";
    const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim().slice(0, 200) : "";
    if (!requestId || !action) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    if (action === "rejected" && adminNote.length < 3) return NextResponse.json({ error: "Enter a rejection reason" }, { status: 400 });

    const editRequestRef = adminDb.collection(COLLECTIONS.CELEBRATION_EDIT_REQUESTS).doc(requestId);
    await adminDb.runTransaction(async (transaction) => {
      const editRequestSnapshot = await transaction.get(editRequestRef);
      const editRequest = editRequestSnapshot.data();
      if (!editRequestSnapshot.exists || !editRequest) throw new Error("EDIT_REQUEST_NOT_FOUND");
      if (editRequest.status !== "pending") throw new Error("EDIT_REQUEST_PROCESSED");

      if (action === "approved") {
        const celebrationRef = adminDb.collection(COLLECTIONS.CELEBRATIONS).doc(editRequest.celebrationId);
        const celebrationSnapshot = await transaction.get(celebrationRef);
        const celebration = celebrationSnapshot.data();
        if (!celebrationSnapshot.exists || !celebration) throw new Error("CELEBRATION_NOT_FOUND");
        const requested = editRequest.requestedValues ?? {};
        const eventDate = String(requested.eventDate ?? "");
        const celebrationUpdate: Record<string, unknown> = {
          birthdayDate: eventDate,
          eventDate,
          updatedAt: Timestamp.now(),
        };

        if (editRequest.occasionType === "wedding") {
          const partnerOne = String(requested.partnerOne ?? "");
          const partnerTwo = String(requested.partnerTwo ?? "");
          const currentWeddingDate = String(celebration.weddingData?.date ?? "");
          const timeSuffix = currentWeddingDate.includes("T") ? currentWeddingDate.slice(currentWeddingDate.indexOf("T")) : "T18:00:00+05:30";
          celebrationUpdate.recipientName = `${partnerOne} & ${partnerTwo}`;
          celebrationUpdate["weddingData.couple.partnerOne"] = partnerOne;
          celebrationUpdate["weddingData.couple.partnerTwo"] = partnerTwo;
          celebrationUpdate["weddingData.couple.monogram"] = `${partnerOne.charAt(0)} · ${partnerTwo.charAt(0)}`.toUpperCase();
          celebrationUpdate["weddingData.date"] = `${eventDate}${timeSuffix}`;
        } else {
          celebrationUpdate.recipientName = String(requested.recipientName ?? "");
        }
        transaction.update(celebrationRef, celebrationUpdate);
      }

      transaction.update(editRequestRef, {
        status: action,
        adminNote,
        processedAt: Timestamp.now(),
        processedBy: admin.uid,
      });
    });

    return NextResponse.json({ success: true, status: action });
  } catch (error) {
    return errorResponse(error);
  }
}
