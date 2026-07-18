"use client";

/**
 * Lightweight, vendor-agnostic analytics helper.
 *
 * It writes events to two sinks when available:
 *   1. `window.gtag`   — Google Analytics 4 (if the GA script is loaded)
 *   2. `window.dataLayer` — GTM / any tag manager
 *
 * When no provider is configured it degrades gracefully to a `console.debug`
 * in development so the funnel is still observable locally. This keeps product
 * code free of any specific vendor lock-in — wire up a provider by adding its
 * script to the root layout and events flow automatically.
 */
export type AnalyticsEvent =
  | "create_started"
  | "create_step_completed"
  | "preview_viewed"
  | "checkout_started"
  | "purchase_completed"
  | "viral_footer_cta_click"
  | "demo_viewed"
  | "referral_applied";

type Props = Record<string, string | number | boolean | undefined | null>;

export function trackEvent(event: AnalyticsEvent | string, props: Props = {}): void {
  if (typeof window === "undefined") return;

  const payload = { ...props, ts: Date.now() };

  try {
    const w = window as unknown as {
      gtag?: (...args: unknown[]) => void;
      dataLayer?: unknown[];
    };
    if (typeof w.gtag === "function") {
      w.gtag("event", event, payload);
    }
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event, ...payload });
    }
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug(`[analytics] ${event}`, payload);
    }
  } catch {
    // Analytics must never break the app.
  }
}
