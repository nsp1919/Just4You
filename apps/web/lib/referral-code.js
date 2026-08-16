const REFERRAL_CODE_PATTERN = /^J4Y[A-Z0-9]{10}$/;

/** @param {string | null | undefined} code */
export function normalizeReferralCode(code) {
  const normalized = code?.trim().toUpperCase() ?? "";
  return REFERRAL_CODE_PATTERN.test(normalized) ? normalized : null;
}

/** @param {string} uid */
export function referralCodeFor(uid) {
  const clean = uid.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `J4Y${clean.padEnd(10, "0").slice(0, 10)}`;
}