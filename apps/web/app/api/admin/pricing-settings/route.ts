import { Timestamp } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-session";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, FEATURE_ADDONS, type PricingSettings } from "@/lib/constants";
import {
  getPricingSettings,
  MAX_PRICE_INR,
  MIN_BASE_PRICE_INR,
  MIN_FEATURE_PRICE_INR,
} from "@/lib/pricing-settings";

export const dynamic = "force-dynamic";

function authError(error: unknown): NextResponse | null {
  const message = error instanceof Error ? error.message : "";
  if (message === "UNAUTHORIZED" || message === "ADMIN_SESSION_REQUIRED") return NextResponse.json({ error: "Admin session required" }, { status: 401 });
  if (message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

function validPrice(value: unknown, minimum: number): value is number {
  return Number.isInteger(value) && Number(value) >= minimum && Number(value) <= MAX_PRICE_INR;
}

function validateSettings(value: unknown): PricingSettings | null {
  if (!value || typeof value !== "object") return null;
  const settings = value as Partial<PricingSettings>;
  if (!validPrice(settings.basePriceInr, MIN_BASE_PRICE_INR)
    || !validPrice(settings.weddingBasePriceInr, MIN_BASE_PRICE_INR)
    || !validPrice(settings.weddingAdditionalCeremonyPriceInr, MIN_FEATURE_PRICE_INR)
    || !validPrice(settings.weddingRsvpPriceInr, MIN_FEATURE_PRICE_INR)
    || !validPrice(settings.weddingCustomRevealMusicPriceInr, MIN_FEATURE_PRICE_INR)
    || !settings.addonPrices
    || FEATURE_ADDONS.some((addon) => !validPrice(settings.addonPrices?.[addon.id], MIN_FEATURE_PRICE_INR))) {
    return null;
  }
  return settings as PricingSettings;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminRequest(request);
    return NextResponse.json({
      settings: await getPricingSettings(),
      allowedRange: { minBase: MIN_BASE_PRICE_INR, minFeature: MIN_FEATURE_PRICE_INR, max: MAX_PRICE_INR },
    });
  } catch (error) {
    return authError(error) ?? NextResponse.json({ error: "Unable to load pricing settings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminRequest(request);
    const body = await request.json().catch(() => ({}));
    const settings = validateSettings(body.settings);
    if (!settings) {
      return NextResponse.json({ error: `Enter whole-rupee prices between ₹${MIN_FEATURE_PRICE_INR.toLocaleString("en-IN")} and ₹${MAX_PRICE_INR.toLocaleString("en-IN")}. Base prices must be at least ₹${MIN_BASE_PRICE_INR}.` }, { status: 400 });
    }
    await adminDb.collection(COLLECTIONS.APP_CONFIG).doc("pricingSettings").set({
      ...settings,
      updatedAt: Timestamp.now(),
      updatedBy: admin.uid,
    });
    return NextResponse.json({ settings });
  } catch (error) {
    return authError(error) ?? NextResponse.json({ error: "Unable to save pricing settings" }, { status: 500 });
  }
}
