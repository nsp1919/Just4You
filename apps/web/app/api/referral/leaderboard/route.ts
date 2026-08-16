import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// Public referral leaderboard — top referrers by successful referrals, with names
// masked for privacy (first name + last initial). Read via the Admin SDK so it
// works despite the per-user Firestore read rules.

export const dynamic = "force-dynamic";
export const revalidate = 0;

function maskName(name?: string): string {
  if (!name) return "A friend";
  const parts = name.trim().split(/\s+/);
  const first = parts[0];
  const initial = parts[1]?.[0];
  return initial ? `${first} ${initial}.` : first;
}

export async function GET() {
  try {
    const snap = await adminDb
      .collection("users")
      .where("referralCount", ">", 0)
      .orderBy("referralCount", "desc")
      .limit(10)
      .get();

    const leaders = snap.docs.map((d, i) => {
      const u = d.data() as { name?: string; walletBalance?: number; referralCredits?: number; referralCount?: number };
      return {
        rank: i + 1,
        name: maskName(u.name),
        walletBalance: u.walletBalance ?? u.referralCredits ?? 0,
        referrals: u.referralCount ?? 0,
      };
    });

    return NextResponse.json({ leaders });
  } catch (e) {
    // Likely a missing composite index on first run — fail soft with empty list.
    console.error("leaderboard error", e);
    return NextResponse.json({ leaders: [] });
  }
}
