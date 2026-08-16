import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, REFERRAL_JOIN_WALLET_BONUS_INR } from "@/lib/constants";
import { normalizeReferralCode, referralCodeFor } from "@/lib/referral-code";
import { resolveProfileWallet } from "@/lib/wallet-profile";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const code = normalizeReferralCode(req.nextUrl.searchParams.get("code"));
  if (!code) return NextResponse.json({ valid: false });

  const match = await adminDb
    .collection(COLLECTIONS.USERS)
    .where("referralCode", "==", code)
    .limit(1)
    .get();

  return NextResponse.json({ valid: !match.empty });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    const body = await req.json().catch(() => ({}));
    const requestedName = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
    const submittedCode = normalizeReferralCode(body.referralCode);
    const ownCode = referralCodeFor(decoded.uid);
    const userRef = adminDb.collection(COLLECTIONS.USERS).doc(decoded.uid);

    let validReferrerId: string | null = null;
    if (submittedCode && submittedCode !== ownCode) {
      const [referrerMatch, paidMatch] = await Promise.all([
        adminDb
          .collection(COLLECTIONS.USERS)
          .where("referralCode", "==", submittedCode)
          .limit(1)
          .get(),
        adminDb
          .collection(COLLECTIONS.CELEBRATIONS)
          .where("userId", "==", decoded.uid)
          .where("paymentStatus", "==", "paid")
          .limit(1)
          .get(),
      ]);
      const referrer = referrerMatch.docs[0];
      if (referrer && referrer.id !== decoded.uid && paidMatch.empty) {
        validReferrerId = referrer.id;
      }
    }

    await adminDb.runTransaction(async (transaction) => {
      const snap = await transaction.get(userRef);
      const existing = snap.data();
      const displayName = requestedName || decoded.name || decoded.email?.split("@")[0] || "User";
      const profile = {
        uid: decoded.uid,
        email: decoded.email ?? existing?.email ?? "",
        name: displayName,
        ...(decoded.picture ? { photoURL: decoded.picture } : {}),
      };

      if (!snap.exists) {
        transaction.create(userRef, {
          ...profile,
          role: decoded.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? "admin" : "user",
          isBlocked: false,
          referralCode: ownCode,
          referralCredits: 0,
          walletBalance: validReferrerId ? REFERRAL_JOIN_WALLET_BONUS_INR : 0,
          referralJoinBonusGranted: Boolean(validReferrerId),
          referralCount: 0,
          freeAddonCredits: 0,
          ...(validReferrerId && submittedCode ? { referredBy: submittedCode } : {}),
          createdAt: Timestamp.now(),
        });
        return;
      }

      const update: Record<string, unknown> = {
        referralCode: normalizeReferralCode(existing?.referralCode) || ownCode,
      };
      const attachingReferral = Boolean(
        !existing?.referredBy &&
        existing?.referralRedeemed !== true &&
        validReferrerId &&
        submittedCode
      );
      const hasStoredReferral = Boolean(normalizeReferralCode(existing?.referredBy));
      const wallet = resolveProfileWallet(
        existing ?? {},
        hasStoredReferral || attachingReferral,
        REFERRAL_JOIN_WALLET_BONUS_INR,
      );

      if (wallet.needsWalletWrite) {
        update.walletBalance = wallet.walletBalance;
      }
      if (wallet.shouldGrantJoinBonus) update.referralJoinBonusGranted = true;
      if (requestedName && requestedName !== "User") update.name = requestedName;
      if (!existing?.email && profile.email) update.email = profile.email;
      if (!existing?.uid) update.uid = decoded.uid;
      if (decoded.picture && !existing?.photoURL) update.photoURL = decoded.picture;
      if (attachingReferral && submittedCode) {
        update.referredBy = submittedCode;
      }
      transaction.update(userRef, update);
    });

    const profileSnap = await userRef.get();
    return NextResponse.json({ profile: profileSnap.data() });
  } catch (error) {
    console.error("user-profile error:", error);
    return NextResponse.json({ error: "Failed to initialize user profile" }, { status: 500 });
  }
}