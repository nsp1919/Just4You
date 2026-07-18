"use client";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * Fires a single analytics event on mount. Useful for tracking views of
 * server-rendered pages (e.g. theme demos) from a tiny client island.
 */
export default function AnalyticsBeacon({
  event,
  props,
}: {
  event: string;
  props?: Record<string, string | number | boolean>;
}) {
  useEffect(() => {
    trackEvent(event, props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
