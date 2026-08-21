export const MIN_WALLET_WITHDRAWAL_INR = 300;

function wholeNonNegative(value) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

/**
 * Derives the cashable portion of a wallet. Older profiles did not store this
 * separately, so their completed referral count is used as a conservative cap.
 */
export function resolveWithdrawableBalance(profile, referralRewardInr) {
  const walletBalance = wholeNonNegative(profile.walletBalance ?? profile.referralCredits);
  const storedWithdrawable = Number(profile.walletWithdrawableBalance);
  const earnedReferralTotal = wholeNonNegative(profile.referralCount) * wholeNonNegative(referralRewardInr);
  const withdrawableBalance = Number.isFinite(storedWithdrawable)
    ? wholeNonNegative(storedWithdrawable)
    : earnedReferralTotal;

  return Math.min(walletBalance, withdrawableBalance);
}

/**
 * Applies checkout usage to the total wallet while spending promotional,
 * non-cashable credit before cashable referral earnings.
 */
export function debitWalletForCheckout(walletBalance, withdrawableBalance, debitInr) {
  const total = wholeNonNegative(walletBalance);
  const cashable = Math.min(total, wholeNonNegative(withdrawableBalance));
  const debit = Math.min(total, wholeNonNegative(debitInr));
  const promotionalBalance = total - cashable;
  const cashableDebit = Math.max(0, debit - promotionalBalance);

  return {
    walletBalance: total - debit,
    walletWithdrawableBalance: cashable - cashableDebit,
  };
}