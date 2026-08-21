import test from "node:test";
import assert from "node:assert/strict";
import { calculateWalletCheckout } from "../../apps/web/lib/wallet-checkout.js";

test("₹50 wallet balance leaves ₹149 to pay on the base package", () => {
  assert.deepEqual(calculateWalletCheckout(19900, 50), {
    amountPaise: 14900,
    walletAppliedInr: 50,
    freeAddonDiscountPaise: 0,
  });
});

test("₹50 referrer reward leaves ₹149 to pay on the base package", () => {
  assert.deepEqual(calculateWalletCheckout(19900, 50), {
    amountPaise: 14900,
    walletAppliedInr: 50,
    freeAddonDiscountPaise: 0,
  });
});

test("wallet usage is applied after a free add-on credit", () => {
  assert.deepEqual(calculateWalletCheckout(32600, 50, 7900), {
    amountPaise: 19700,
    walletAppliedInr: 50,
    freeAddonDiscountPaise: 7900,
  });
});

test("wallet usage retains the minimum ₹1 online provider charge", () => {
  assert.deepEqual(calculateWalletCheckout(19900, 500), {
    amountPaise: 100,
    walletAppliedInr: 198,
    freeAddonDiscountPaise: 0,
  });
});