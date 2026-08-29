import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, SOCIAL_SHARE_REWARD_INR } from "@/lib/constants";
import { requireAdminRequest } from "@/lib/admin-session";
import { creditWithdrawableEarnings, resolveWithdrawableBalance } from "@/lib/wallet-withdrawal";

export const dynamic = "force-dynamic";

async function requireAdmin(request: NextRequest) {
  return requireAdminRequest(request);
}

function serializeClaim(document: FirebaseFirestore.QueryDocumentSnapshot) {
  const data = document.data();
  return {
    id: document.id,
    userEmail: data.userEmail ?? "",
    recipientName: data.recipientName ?? "",
    platform: data.platform,
    instagramHandle: data.instagramHandle ?? "",
    instagramPostUrl: data.instagramPostUrl ?? data.proofUrl ?? "",
    rewardInr: SOCIAL_SHARE_REWARD_INR,
    status: data.status,
    submittedAt: data.submittedAt?.toDate?.().toISOString?.() ?? null,
    reviewedAt: data.reviewedAt?.toDate?.().toISOString?.() ?? null,
    rejectionReason: data.rejectionReason ?? "",
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const snapshot = await adminDb
      .collection(COLLECTIONS.SOCIAL_REWARD_CLAIMS)
      .orderBy("submittedAt", "desc")
      .limit(100)
      .get();
    return NextResponse.json({ claims: snapshot.docs.map(serializeClaim) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED" || message === "ADMIN_SESSION_REQUIRED") return NextResponse.json({ error: "Admin session required" }, { status: 401 });
    if (message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("social rewards GET failed:", error);
    return NextResponse.json({ error: "Unable to load social reward claims." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json().catch(() => ({}));
    const claimId = typeof body.claimId === "string" ? body.claimId.trim() : "";
    const action = body.action === "approved" || body.action === "rejected" ? body.action : "";
    const rejectionReason = typeof body.rejectionReason === "string" ? body.rejectionReason.trim().slice(0, 240) : "";
    const instagramPostUrl = typeof body.instagramPostUrl === "string" ? body.instagramPostUrl.trim().slice(0, 2048) : "";
    if (!claimId || !action) return NextResponse.json({ error: "Invalid review request." }, { status: 400 });
    if (action === "rejected" && rejectionReason.length < 3) {
      return NextResponse.json({ error: "Enter a rejection reason." }, { status: 400 });
    }
    if (action === "approved") {
      try {
        const post = new URL(instagramPostUrl);
        if (post.protocol !== "https:" || !/(^|\.)instagram\.com$/.test(post.hostname)) throw new Error("INVALID_INSTAGRAM_URL");
      } catch {
        return NextResponse.json({ error: "Enter the verified public Instagram Reel or post URL before approval." }, { status: 400 });
      }
    }

    const claimRef = adminDb.collection(COLLECTIONS.SOCIAL_REWARD_CLAIMS).doc(claimId);
    await adminDb.runTransaction(async (transaction) => {
      const claimSnapshot = await transaction.get(claimRef);
      const claim = claimSnapshot.data();
      if (!claimSnapshot.exists || !claim) throw new Error("CLAIM_NOT_FOUND");
      if (claim.status !== "pending") throw new Error("CLAIM_ALREADY_PROCESSED");

      if (action === "approved") {
        const userRef = adminDb.collection(COLLECTIONS.USERS).doc(claim.userId);
        const userSnapshot = await transaction.get(userRef);
        const user = userSnapshot.data();
        if (!userSnapshot.exists || !user) throw new Error("PROFILE_NOT_FOUND");
        if (user.isBlocked === true) throw new Error("ACCOUNT_BLOCKED");
        const walletBalance = Math.max(0, Math.floor(Number(user.walletBalance ?? user.referralCredits) || 0));
        const balances = creditWithdrawableEarnings(
          walletBalance,
          resolveWithdrawableBalance(user, 50),
          SOCIAL_SHARE_REWARD_INR,
        );
        transaction.update(userRef, {
          ...balances,
          socialShareRewardTotal: FieldValue.increment(SOCIAL_SHARE_REWARD_INR),
        });
      }

      transaction.update(claimRef, {
        status: action,
        rewardInr: SOCIAL_SHARE_REWARD_INR,
        reviewedAt: Timestamp.now(),
        reviewedBy: admin.uid,
        instagramPostUrl: action === "approved" ? instagramPostUrl : "",
        proofUrl: action === "approved" ? instagramPostUrl : "",
        rejectionReason: action === "rejected" ? rejectionReason : "",
      });
    });

    return NextResponse.json({ success: true, status: action, rewardInr: SOCIAL_SHARE_REWARD_INR });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const knownErrors: Record<string, { error: string; status: number }> = {
      UNAUTHORIZED: { error: "Unauthorized", status: 401 },
      ADMIN_SESSION_REQUIRED: { error: "Admin session required", status: 401 },
      FORBIDDEN: { error: "Forbidden", status: 403 },
      CLAIM_NOT_FOUND: { error: "Reward claim not found.", status: 404 },
      CLAIM_ALREADY_PROCESSED: { error: "Reward claim has already been processed.", status: 409 },
      PROFILE_NOT_FOUND: { error: "Creator profile not found.", status: 404 },
      ACCOUNT_BLOCKED: { error: "The creator account is blocked.", status: 403 },
    };
    if (knownErrors[message]) return NextResponse.json({ error: knownErrors[message].error }, { status: knownErrors[message].status });
    console.error("social rewards POST failed:", error);
    return NextResponse.json({ error: "Unable to process the social reward claim." }, { status: 500 });
  }
}