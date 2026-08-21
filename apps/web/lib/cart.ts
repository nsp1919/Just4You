"use client";
import { FEATURE_ADDONS, type FeatureId } from "@/lib/constants";

// Persists the user's selected paid features between the /pricing cart and the
// create flow. Kept in localStorage so a selection survives navigation and
// sign-in redirects.

const CART_KEY = "j4y_cart_features";

export function saveCartFeatures(features: FeatureId[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify([...new Set(features)]));
  } catch {
    // ignore storage failures
  }
}

export function loadCartFeatures(): FeatureId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const validIds = new Set(FEATURE_ADDONS.map((feature) => feature.id));
    return parsed.filter((feature): feature is FeatureId => validIds.has(feature as FeatureId));
  } catch {
    return [];
  }
}

export function clearCartFeatures(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CART_KEY);
  } catch {
    // ignore
  }
}
