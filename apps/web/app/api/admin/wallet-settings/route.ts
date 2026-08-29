import { Timestamp } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-session";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { getMinimumWithdrawalInr, MAX_ALLOWED_WITHDRAWAL_INR, MIN_ALLOWED_WITHDRAWAL_INR } from "@/lib/wallet-settings";

export const dynamic = "force-dynamic";

function authError(error: unknown): NextResponse | null {
  const message = error instanceof Error ? error.message : "";
  if (message === "UNAUTHORIZED" || message === "ADMIN_SESSION_REQUIRED") return NextResponse.json({ error: "Admin session required" }, { status: 401 });
  return null;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminRequest(request);
    return NextResponse.json({
      minimumWithdrawalInr: await getMinimumWithdrawalInr(),
      allowedRange: { min: MIN_ALLOWED_WITHDRAWAL_INR, max: MAX_ALLOWED_WITHDRAWAL_INR },
    });
  } catch (error) {
    return authError(error) ?? NextResponse.json({ error: "Unable to load wallet settings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminRequest(request);
    const body = await request.json().catch(() => ({}));
    const minimumWithdrawalInr = Number(body.minimumWithdrawalInr);
    if (!Number.isInteger(minimumWithdrawalInr) || minimumWithdrawalInr < MIN_ALLOWED_WITHDRAWAL_INR || minimumWithdrawalInr > MAX_ALLOWED_WITHDRAWAL_INR) {
      return NextResponse.json({ error: `Minimum withdrawal must be between ₹${MIN_ALLOWED_WITHDRAWAL_INR} and ₹${MAX_ALLOWED_WITHDRAWAL_INR}.` }, { status: 400 });
    }
    await adminDb.collection(COLLECTIONS.APP_CONFIG).doc("walletSettings").set({
      minimumWithdrawalInr,
      updatedAt: Timestamp.now(),
      updatedBy: admin.uid,
    }, { merge: true });
    return NextResponse.json({ minimumWithdrawalInr });
  } catch (error) {
    return authError(error) ?? NextResponse.json({ error: "Unable to save wallet settings" }, { status: 500 });
  }
}