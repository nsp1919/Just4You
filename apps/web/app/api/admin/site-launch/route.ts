import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdminRequest } from "@/lib/admin-session";
import { COLLECTIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

async function requireAdmin(req: NextRequest): Promise<string> {
  const admin = await requireAdminRequest(req);
  return admin.uid;
}

function serializeTimestamp(value: unknown): string | null {
  if (value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

function errorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "";
  if (message === "UNAUTHORIZED" || message === "ADMIN_SESSION_REQUIRED") return NextResponse.json({ error: "Admin session required" }, { status: 401 });
  if (message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  console.error("admin site launch error:", error);
  return NextResponse.json({ error: "Unable to manage launch settings" }, { status: 500 });
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const [settingsSnap, ordersSnap] = await Promise.all([
      adminDb.collection(COLLECTIONS.APP_CONFIG).doc("siteLaunch").get(),
      adminDb.collection(COLLECTIONS.PREBOOK_ORDERS).orderBy("createdAt", "desc").limit(200).get(),
    ]);
    const settings = settingsSnap.data() ?? {};
    const orders = ordersSnap.docs.map((order) => {
      const data = order.data();
      return {
        id: order.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        occasion: data.occasion,
        message: data.message,
        status: data.status,
        createdAt: serializeTimestamp(data.createdAt),
      };
    });
    return NextResponse.json({
      settings: {
        prelaunchEnabled: settings.prelaunchEnabled === true,
        launchAt: serializeTimestamp(settings.launchAt),
      },
      orders,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminId = await requireAdmin(req);
    const body = await req.json().catch(() => ({}));

    if (body.action === "updateSettings") {
      const launchDate = typeof body.launchAt === "string" && body.launchAt ? new Date(body.launchAt) : null;
      if (body.prelaunchEnabled && (!launchDate || Number.isNaN(launchDate.getTime()) || launchDate.getTime() <= Date.now())) {
        return NextResponse.json({ error: "Choose a valid future launch date and time" }, { status: 400 });
      }
      await adminDb.collection(COLLECTIONS.APP_CONFIG).doc("siteLaunch").set({
        prelaunchEnabled: body.prelaunchEnabled === true,
        launchAt: launchDate ? Timestamp.fromDate(launchDate) : null,
        updatedAt: Timestamp.now(),
        updatedBy: adminId,
      }, { merge: true });
      return NextResponse.json({ success: true });
    }

    if (body.action === "updatePrebook") {
      const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
      const status = body.status === "accepted" || body.status === "rejected" ? body.status : "";
      if (!orderId || !status) return NextResponse.json({ error: "Invalid prebook update" }, { status: 400 });
      await adminDb.collection(COLLECTIONS.PREBOOK_ORDERS).doc(orderId).update({
        status,
        processedAt: Timestamp.now(),
        processedBy: adminId,
        paymentWaived: status === "accepted",
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}