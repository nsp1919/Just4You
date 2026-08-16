import test from "node:test";
import assert from "node:assert/strict";
import { calculateWalletCheckout } from "../../apps/web/lib/wallet-checkout.js";

test("₹50 wallet balance leaves ₹99 to pay on the base package", () => {
  assert.deepEqual(calculateWalletCheckout(14900, 50), {
    amountPaise: 9900,
    walletAppliedInr: 50,
    freeAddonDiscountPaise: 0,
  });
});

test("₹100 referrer reward leaves ₹49 to pay on the base package", () => {
  assert.deepEqual(calculateWalletCheckout(14900, 100), {
    amountPaise: 4900,
    walletAppliedInr: 100,
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
  assert.deepEqual(calculateWalletCheckout(14900, 500), {
    amountPaise: 100,
    walletAppliedInr: 148,
    freeAddonDiscountPaise: 0,
  });
});