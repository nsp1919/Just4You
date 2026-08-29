import test from "node:test";
import assert from "node:assert/strict";
import {
  MIN_WALLET_WITHDRAWAL_INR,
  creditWithdrawableEarnings,
  debitWalletForCheckout,
  resolveWithdrawableBalance,
} from "../../apps/web/lib/wallet-withdrawal.js";

test("bank withdrawals start at ₹300", () => {
  assert.equal(MIN_WALLET_WITHDRAWAL_INR, 300);
});

test("signup bonus is not cash withdrawable", () => {
  assert.equal(resolveWithdrawableBalance({ walletBalance: 50, referralCount: 0 }, 50), 0);
});

test("legacy referral earnings are recognized up to the remaining wallet balance", () => {
  assert.equal(resolveWithdrawableBalance({ walletBalance: 250, referralCount: 3 }, 50), 150);
});

test("stored cash balance cannot exceed the total wallet", () => {
  assert.equal(
    resolveWithdrawableBalance({ walletBalance: 80, walletWithdrawableBalance: 100 }, 50),
    80,
  );
});

test("checkout spends promotional credit before cashable earnings", () => {
  assert.deepEqual(debitWalletForCheckout(250, 200, 40), {
    walletBalance: 210,
    walletWithdrawableBalance: 200,
  });
  assert.deepEqual(debitWalletForCheckout(250, 200, 100), {
    walletBalance: 150,
    walletWithdrawableBalance: 150,
  });
});

test("an Admin-verified social reward becomes bank withdrawable", () => {
  assert.deepEqual(creditWithdrawableEarnings(150, 100, 25), {
    walletBalance: 175,
    walletWithdrawableBalance: 125,
  });
});