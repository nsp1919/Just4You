import { NextResponse } from "next/server";
import { getWalletSettings } from "@/lib/wallet-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { referrerRewardInr, joinBonusInr } = await getWalletSettings();
    return NextResponse.json(
      { referrerRewardInr, joinBonusInr },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    console.error("referral settings GET error:", error);
    return NextResponse.json({ error: "Unable to load referral settings" }, { status: 500 });
  }
}