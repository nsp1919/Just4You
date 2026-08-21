import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { encryptBankAccount } from "@/lib/bank-details";
import { COLLECTIONS, REFERRAL_REWARD_INR } from "@/lib/constants";
import { MIN_WALLET_WITHDRAWAL_INR, resolveWithdrawableBalance } from "@/lib/wallet-withdrawal";

export const dynamic = "force-dynamic";

async function authenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  return adminAuth.verifyIdToken(authHeader.slice(7));
}

function publicRequest(doc: FirebaseFirestore.QueryDocumentSnapshot) {
  const data = doc.data();
  return {
    id: doc.id,
    amountInr: data.amountInr,
    status: data.status,
    accountHolderName: data.accountHolderName,
    bankAccountLast4: data.bankAccountLast4,
    ifsc: data.ifsc,
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
    processedAt: data.processedAt?.toDate?.()?.toISOString() ?? null,
    payoutReference: data.payoutReference ?? null,
    rejectionReason: data.rejectionReason ?? null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const decoded = await authenticatedUser(req);
    const [userSnap, requestsSnap] = await Promise.all([
      adminDb.collection(COLLECTIONS.USERS).doc(decoded.uid).get(),
      adminDb.collection(COLLECTIONS.WALLET_WITHDRAWALS).where("userId", "==", decoded.uid).get(),
    ]);
    const profile = userSnap.data() ?? {};
    const requests = requestsSnap.docs
      .sort((a, b) => (b.data().createdAt?.toMillis?.() ?? 0) - (a.data().createdAt?.toMillis?.() ?? 0))
      .map(publicRequest);

    return NextResponse.json({
      withdrawableBalance: resolveWithdrawableBalance(profile, REFERRAL_REWARD_INR),
      minimumWithdrawal: MIN_WALLET_WITHDRAWAL_INR,
      hasPendingRequest: Boolean(profile.pendingWalletWithdrawalId),
      requests,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("wallet withdrawals GET error:", error);
    return NextResponse.json({ error: "Unable to load withdrawals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const decoded = await authenticatedUser(req);
    const body = await req.json().catch(() => ({}));
    const amountInr = Number(body.amountInr);
    const accountHolderName = typeof body.accountHolderName === "string" ? body.accountHolderName.trim() : "";
    const accountNumber = typeof body.accountNumber === "string" ? body.accountNumber.replace(/[\s-]/g, "") : "";
    const ifsc = typeof body.ifsc === "string" ? body.ifsc.trim().toUpperCase() : "";

    if (!Number.isInteger(amountInr) || amountInr < MIN_WALLET_WITHDRAWAL_INR) {
      return NextResponse.json({ error: `Minimum withdrawal is ₹${MIN_WALLET_WITHDRAWAL_INR}` }, { status: 400 });
    }
    if (accountHolderName.length < 2 || accountHolderName.length > 80) {
      return NextResponse.json({ error: "Enter the account holder name" }, { status: 400 });
    }
    if (!/^\d{9,18}$/.test(accountNumber)) {
      return NextResponse.json({ error: "Enter a valid bank account number" }, { status: 400 });
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
      return NextResponse.json({ error: "Enter a valid IFSC code" }, { status: 400 });
    }

    const encryptedAccountNumber = encryptBankAccount(accountNumber);
    const userRef = adminDb.collection(COLLECTIONS.USERS).doc(decoded.uid);
    const requestRef = adminDb.collection(COLLECTIONS.WALLET_WITHDRAWALS).doc();

    await adminDb.runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userRef);
      const profile = userSnap.data();
      if (!userSnap.exists || !profile) throw new Error("PROFILE_REQUIRED");
      if (profile.isBlocked === true) throw new Error("ACCOUNT_BLOCKED");
      if (profile.pendingWalletWithdrawalId) throw new Error("WITHDRAWAL_ALREADY_PENDING");

      const walletBalance = Math.max(0, Math.floor(Number(profile.walletBalance ?? profile.referralCredits) || 0));
      const withdrawableBalance = resolveWithdrawableBalance(profile, REFERRAL_REWARD_INR);
      if (amountInr > withdrawableBalance) throw new Error("INSUFFICIENT_WITHDRAWABLE_BALANCE");

      transaction.create(requestRef, {
        userId: decoded.uid,
        userEmail: decoded.email ?? profile.email ?? "",
        amountInr,
        status: "pending",
        accountHolderName,
        encryptedAccountNumber,
        bankAccountLast4: accountNumber.slice(-4),
        ifsc,
        createdAt: Timestamp.now(),
      });
      transaction.update(userRef, {
        walletBalance: walletBalance - amountInr,
        walletWithdrawableBalance: withdrawableBalance - amountInr,
        pendingWalletWithdrawalId: requestRef.id,
      });
    });

    return NextResponse.json({ success: true, requestId: requestRef.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const knownErrors: Record<string, { error: string; status: number }> = {
      UNAUTHORIZED: { error: "Unauthorized", status: 401 },
      PROFILE_REQUIRED: { error: "Wallet profile not found", status: 404 },
      ACCOUNT_BLOCKED: { error: "This account is blocked", status: 403 },
      WITHDRAWAL_ALREADY_PENDING: { error: "You already have a pending withdrawal", status: 409 },
      INSUFFICIENT_WITHDRAWABLE_BALANCE: { error: "Insufficient withdrawable balance", status: 400 },
      BANK_ENCRYPTION_NOT_CONFIGURED: { error: "Bank withdrawals are not configured yet", status: 503 },
    };
    if (knownErrors[message]) {
      return NextResponse.json({ error: knownErrors[message].error }, { status: knownErrors[message].status });
    }
    console.error("wallet withdrawals POST error:", error);
    return NextResponse.json({ error: "Unable to create withdrawal" }, { status: 500 });
  }
}