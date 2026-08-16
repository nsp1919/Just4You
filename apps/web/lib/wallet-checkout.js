/**
 * Calculate how a server-owned wallet reduces an online payment.
 * A ₹1 online remainder is retained because Razorpay cannot create a zero-value order.
 *
 * @param {number} basePaise
 * @param {number} walletBalanceInr
 * @param {number} freeAddonPricePaise
 */
export function calculateWalletCheckout(basePaise, walletBalanceInr, freeAddonPricePaise = 0) {
  const normalizedBasePaise = Math.max(100, Math.floor(Number(basePaise) || 0));
  let remainingPaise = normalizedBasePaise;

  const freeAddonDiscountPaise = Math.min(
    Math.max(0, Math.floor(Number(freeAddonPricePaise) || 0)),
    Math.max(0, remainingPaise - 100),
  );
  remainingPaise -= freeAddonDiscountPaise;

  const normalizedWalletInr = Math.max(0, Math.floor(Number(walletBalanceInr) || 0));
  const walletAppliedInr = Math.min(
    Math.floor(Math.max(0, remainingPaise - 100) / 100),
    normalizedWalletInr,
  );
  remainingPaise -= walletAppliedInr * 100;

  return {
    amountPaise: remainingPaise,
    walletAppliedInr,
    freeAddonDiscountPaise,
  };
}