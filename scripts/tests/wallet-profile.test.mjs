import test from "node:test";
import assert from "node:assert/strict";
import { resolveProfileWallet } from "../../apps/web/lib/wallet-profile.js";

test("a referred existing profile receives the ₹50 join bonus once", () => {
  assert.deepEqual(resolveProfileWallet({ walletBalance: 0 }, true, 50), {
    walletBalance: 50,
    shouldGrantJoinBonus: true,
    needsWalletWrite: true,
  });
});

test("an already-granted join bonus is idempotent", () => {
  assert.deepEqual(
    resolveProfileWallet({ walletBalance: 50, referralJoinBonusGranted: true }, true, 50),
    {
      walletBalance: 50,
      shouldGrantJoinBonus: false,
      needsWalletWrite: false,
    },
  );
});

test("an Admin-configured join bonus is granted exactly once", () => {
  assert.deepEqual(resolveProfileWallet({ walletBalance: 0 }, true, 175), {
    walletBalance: 175,
    shouldGrantJoinBonus: true,
    needsWalletWrite: true,
  });
  assert.equal(
    resolveProfileWallet({ walletBalance: 175, referralJoinBonusGranted: true }, true, 175).walletBalance,
    175,
  );
});

test("legacy referral credits migrate without losing balance", () => {
  assert.deepEqual(resolveProfileWallet({ referralCredits: 200 }, false, 50), {
    walletBalance: 200,
    shouldGrantJoinBonus: false,
    needsWalletWrite: true,
  });
});

test("paid or reserved legacy referrals do not receive a retroactive join bonus", () => {
  assert.equal(resolveProfileWallet({ referralRedeemed: true }, true, 50).shouldGrantJoinBonus, false);
  assert.equal(
    resolveProfileWallet({ referralDiscountReservationCelebrationId: "pending" }, true, 50).shouldGrantJoinBonus,
    false,
  );
});