import "server-only";
import { adminDb } from "@/lib/firebase-admin";
import {
  COLLECTIONS,
  DEFAULT_PRICING_SETTINGS,
  FEATURE_ADDONS,
  type FeatureId,
  type PricingSettings,
} from "@/lib/constants";

export const MIN_BASE_PRICE_INR = 1;
export const MIN_FEATURE_PRICE_INR = 0;
export const MAX_PRICE_INR = 100_000;

function boundedInteger(value: unknown, min: number, fallback: number): number {
  const amount = Number(value);
  return Number.isInteger(amount) && amount >= min && amount <= MAX_PRICE_INR ? amount : fallback;
}

export function normalizePricingSettings(value: unknown): PricingSettings {
  const data = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const rawAddonPrices = data.addonPrices && typeof data.addonPrices === "object"
    ? data.addonPrices as Record<string, unknown>
    : {};
  const addonPrices = Object.fromEntries(FEATURE_ADDONS.map((addon) => [
    addon.id,
    boundedInteger(rawAddonPrices[addon.id], MIN_FEATURE_PRICE_INR, DEFAULT_PRICING_SETTINGS.addonPrices[addon.id]),
  ])) as Record<FeatureId, number>;

  return {
    basePriceInr: boundedInteger(data.basePriceInr, MIN_BASE_PRICE_INR, DEFAULT_PRICING_SETTINGS.basePriceInr),
    addonPrices,
    weddingBasePriceInr: boundedInteger(data.weddingBasePriceInr, MIN_BASE_PRICE_INR, DEFAULT_PRICING_SETTINGS.weddingBasePriceInr),
    weddingAdditionalCeremonyPriceInr: boundedInteger(data.weddingAdditionalCeremonyPriceInr, MIN_FEATURE_PRICE_INR, DEFAULT_PRICING_SETTINGS.weddingAdditionalCeremonyPriceInr),
    weddingRsvpPriceInr: boundedInteger(data.weddingRsvpPriceInr, MIN_FEATURE_PRICE_INR, DEFAULT_PRICING_SETTINGS.weddingRsvpPriceInr),
    weddingCustomRevealMusicPriceInr: boundedInteger(data.weddingCustomRevealMusicPriceInr, MIN_FEATURE_PRICE_INR, DEFAULT_PRICING_SETTINGS.weddingCustomRevealMusicPriceInr),
  };
}

export async function getPricingSettings(): Promise<PricingSettings> {
  const snapshot = await adminDb.collection(COLLECTIONS.APP_CONFIG).doc("pricingSettings").get();
  return normalizePricingSettings(snapshot.data());
}
