import test from "node:test";
import assert from "node:assert/strict";
import {
  hostingExpiryDateFor,
  hostingYearsFor,
  normalizeVanitySlug,
} from "../../apps/web/lib/constants.ts";

test("3-year hosting expires exactly three calendar years after activation", () => {
  const startsAt = new Date("2026-09-01T12:00:00.000Z");
  assert.equal(hostingYearsFor(["hosting_3yr"]), 3);
  assert.equal(hostingExpiryDateFor(["hosting_3yr"], startsAt)?.toISOString(), "2029-09-01T12:00:00.000Z");
});

test("lifetime hosting has no automatic expiry", () => {
  assert.equal(hostingYearsFor(["hosting_lifetime"]), "lifetime");
  assert.equal(hostingExpiryDateFor(["hosting_lifetime"]), null);
});

test("base hosting defaults to one calendar year", () => {
  const startsAt = new Date("2026-09-01T12:00:00.000Z");
  assert.equal(hostingExpiryDateFor([], startsAt)?.toISOString(), "2027-09-01T12:00:00.000Z");
});

test("custom links are normalized to safe stable path segments", () => {
  assert.equal(normalizeVanitySlug("  Priya's   Birthday!  "), "priya-s-birthday");
  assert.equal(normalizeVanitySlug("--Our---Day--"), "our-day");
  assert.equal(normalizeVanitySlug("a".repeat(50)).length, 40);
});
