"use client";

// Referral helpers — deterministic, storage-light. A user's referral code is
// derived from their Firebase UID so it never needs a separate lookup/write.

const REF_STORAGE_KEY = "j4y_ref";

/** Build a short, shareable referral code from a Firebase UID. */
export function referralCodeFor(uid: string): string {
  // Uppercase alphanumerics from the uid, prefixed for brand recognition.
  const clean = uid.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `J4Y${clean.slice(0, 6)}`;
}

/** Full share URL a user can send to friends. */
export function referralLinkFor(uid: string): string {
  const base =
    (typeof window !== "undefined" && window.location.origin) ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://just4you.buzz";
  return `${base}/register?ref=${referralCodeFor(uid)}`;
}

/**
 * Capture a `?ref=CODE` param from the current URL and persist it so it's still
 * available after the user completes sign-up. Call on register/landing pages.
 */
export function captureReferralFromUrl(): void {
  if (typeof window === "undefined") return;
  try {
    const code = new URLSearchParams(window.location.search).get("ref");
    if (code) localStorage.setItem(REF_STORAGE_KEY, code.trim().toUpperCase());
  } catch {
    // ignore storage/URL access issues
  }
}

/** Read a previously captured referral code, if any. */
export function getStoredReferral(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(REF_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Clear the stored referral once it has been consumed at sign-up. */
export function clearStoredReferral(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(REF_STORAGE_KEY);
  } catch {
    // ignore
  }
}
