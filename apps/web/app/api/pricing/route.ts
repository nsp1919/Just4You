import { NextResponse } from "next/server";
import { getPricingSettings } from "@/lib/pricing-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getPricingSettings();
    return NextResponse.json(settings, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("pricing GET failed:", error);
    return NextResponse.json({ error: "Unable to load pricing" }, { status: 500 });
  }
}
