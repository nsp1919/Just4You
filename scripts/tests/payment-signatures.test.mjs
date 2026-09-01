import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import {
  signaturesMatch,
  verifyRazorpayPaymentSignature,
} from "../../apps/web/lib/payment-signatures.ts";

test("Razorpay payment signatures accept the matching order and payment", () => {
  const secret = "test-secret";
  const orderId = "order_123";
  const paymentId = "pay_456";
  const signature = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  assert.equal(verifyRazorpayPaymentSignature(orderId, paymentId, signature, secret), true);
});

test("Razorpay payment signatures reject tampering and malformed values", () => {
  assert.equal(verifyRazorpayPaymentSignature("order_123", "pay_456", "00", "test-secret"), false);
  assert.equal(verifyRazorpayPaymentSignature(null, "pay_456", "00", "test-secret"), false);
  assert.equal(signaturesMatch("abcd", "not-hex"), false);
  assert.equal(signaturesMatch("abcd", "ab"), false);
});