import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { decryptBankAccount } from "@/lib/bank-details";
import { COLLECTIONS, REFERRAL_REWARD_INR } from "@/lib/constants";
import { resolveWithdrawableBalance } from "@/lib/wallet-withdrawal";
import { requireAdminRequest } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

async function requireAdmin(req: NextRequest) {
  return requireAdminRequest(req);
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const snap = await adminDb
      .collection(COLLECTIONS.WALLET_WITHDRAWALS)
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();
    const requests = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        amountInr: data.amountInr,
        status: data.status,
        accountHolderName: data.accountHolderName,
        accountNumber: decryptBankAccount(data.encryptedAccountNumber),
        ifsc: data.ifsc,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
        processedAt: data.processedAt?.toDate?.()?.toISOString() ?? null,
        payoutReference: data.payoutReference ?? null,
        rejectionReason: data.rejectionReason ?? null,
      };
    });
    return NextResponse.json({ requests });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED" || message === "ADMIN_SESSION_REQUIRED") return NextResponse.json({ error: "Admin session required" }, { status: 401 });
    if (message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (message === "BANK_ENCRYPTION_NOT_CONFIGURED") {
      return NextResponse.json({ error: "Bank withdrawal encryption is not configured" }, { status: 503 });
    }
    console.error("admin wallet withdrawals GET error:", error);
    return NextResponse.json({ error: "Unable to load withdrawal requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";
    const action = body.action === "paid" || body.action === "rejected" ? body.action : "";
    const payoutReference = typeof body.payoutReference === "string" ? body.payoutReference.trim().slice(0, 100) : "";
    const rejectionReason = typeof body.rejectionReason === "string" ? body.rejectionReason.trim().slice(0, 200) : "";
    if (!requestId || !action) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    if (action === "paid" && payoutReference.length < 3) {
      return NextResponse.json({ error: "Enter the bank transfer reference" }, { status: 400 });
    }
    if (action === "rejected" && rejectionReason.length < 3) {
      return NextResponse.json({ error: "Enter a rejection reason" }, { status: 400 });
    }

    const withdrawalRef = adminDb.collection(COLLECTIONS.WALLET_WITHDRAWALS).doc(requestId);
    await adminDb.runTransaction(async (transaction) => {
      const withdrawalSnap = await transaction.get(withdrawalRef);
      const withdrawal = withdrawalSnap.data();
      if (!withdrawalSnap.exists || !withdrawal) throw new Error("WITHDRAWAL_NOT_FOUND");
      if (withdrawal.status !== "pending") throw new Error("WITHDRAWAL_ALREADY_PROCESSED");

      const userRef = adminDb.collection(COLLECTIONS.USERS).doc(withdrawal.userId);
      const userSnap = await transaction.get(userRef);
      const user = userSnap.data();
      if (!userSnap.exists || !user) throw new Error("PROFILE_REQUIRED");

      if (action === "rejected") {
        const walletBalance = Math.max(0, Math.floor(Number(user.walletBalance ?? user.referralCredits) || 0));
        const withdrawableBalance = resolveWithdrawableBalance(user, REFERRAL_REWARD_INR);
        const refundUpdate: Record<string, unknown> = {
          walletBalance: walletBalance + withdrawal.amountInr,
          walletWithdrawableBalance: withdrawableBalance + withdrawal.amountInr,
        };
        if (user.pendingWalletWithdrawalId === requestId) {
          refundUpdate.pendingWalletWithdrawalId = FieldValue.delete();
        }
        transaction.update(userRef, refundUpdate);
      } else if (user.pendingWalletWithdrawalId === requestId) {
        transaction.update(userRef, { pendingWalletWithdrawalId: FieldValue.delete() });
      }

      transaction.update(withdrawalRef, {
        status: action,
        processedAt: Timestamp.now(),
        processedBy: admin.uid,
        ...(action === "paid" ? { payoutReference } : { rejectionReason }),
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const knownErrors: Record<string, { error: string; status: number }> = {
      UNAUTHORIZED: { error: "Unauthorized", status: 401 },
      ADMIN_SESSION_REQUIRED: { error: "Admin session required", status: 401 },
      FORBIDDEN: { error: "Forbidden", status: 403 },
      WITHDRAWAL_NOT_FOUND: { error: "Withdrawal not found", status: 404 },
      PROFILE_REQUIRED: { error: "User profile not found", status: 404 },
      WITHDRAWAL_ALREADY_PROCESSED: { error: "Withdrawal has already been processed", status: 409 },
    };
    if (knownErrors[message]) {
      return NextResponse.json({ error: knownErrors[message].error }, { status: knownErrors[message].status });
    }
    console.error("admin wallet withdrawals POST error:", error);
    return NextResponse.json({ error: "Unable to process withdrawal" }, { status: 500 });
  }
}