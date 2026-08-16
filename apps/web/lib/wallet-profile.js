/**
 * Resolve wallet state when an existing user profile is initialized.
 *
 * @param {Record<string, unknown>} existing
 * @param {boolean} hasReferralAttribution
 * @param {number} joinBonusInr
 */
export function resolveProfileWallet(existing, hasReferralAttribution, joinBonusInr) {
  const legacyBalance = Math.max(
    0,
    Number(existing.walletBalance ?? existing.referralCredits) || 0,
  );
  const shouldGrantJoinBonus = Boolean(
    existing.referralJoinBonusGranted !== true &&
    existing.referralRedeemed !== true &&
    !existing.referralDiscountReservationCelebrationId &&
    hasReferralAttribution
  );

  return {
    walletBalance: legacyBalance + (shouldGrantJoinBonus ? joinBonusInr : 0),
    shouldGrantJoinBonus,
    needsWalletWrite: typeof existing.walletBalance !== "number" || shouldGrantJoinBonus,
  };
}