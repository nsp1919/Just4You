"use client";

import { useEffect, useState } from "react";
import { DEFAULT_PRICING_SETTINGS, type PricingSettings } from "@/lib/constants";

export function usePricingSettings(): { pricing: PricingSettings; loading: boolean } {
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/pricing", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load pricing");
        setPricing(await response.json() as PricingSettings);
      })
      .catch((error) => {
        if (error instanceof Error && error.name !== "AbortError") console.error("Pricing settings failed:", error);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  return { pricing, loading };
}
