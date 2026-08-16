import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeReferralCode,
  referralCodeFor,
} from "../../apps/web/lib/referral-code.js";

test("referralCodeFor creates a stable normalized code", () => {
  const code = referralCodeFor("ab-cd_1234xyz");
  assert.equal(code, "J4YABCD1234XY");
  assert.equal(normalizeReferralCode(code), code);
});

test("referralCodeFor pads unusually short identifiers", () => {
  assert.equal(referralCodeFor("abc"), "J4YABC0000000");
});

test("normalizeReferralCode accepts only the canonical format", () => {
  assert.equal(normalizeReferralCode("  j4yabcd1234xy  "), "J4YABCD1234XY");
  assert.equal(normalizeReferralCode("J4YTEST01"), null);
  assert.equal(normalizeReferralCode("J4YABCD-234XY"), null);
  assert.equal(normalizeReferralCode(null), null);
});