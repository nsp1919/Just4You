import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path) {
  return readFile(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("client verification and Razorpay webhooks share one fulfillment service", async () => {
  const [verifyRoute, webhookRoute] = await Promise.all([
    source("apps/web/app/api/payment/verify/route.ts"),
    source("apps/web/app/api/payment/webhook/route.ts"),
  ]);
  for (const route of [verifyRoute, webhookRoute]) {
    assert.match(route, /fulfillCelebrationPayment\(/);
    assert.doesNotMatch(route, /paymentStatus:\s*["']paid["']/);
  }
});

test("public clients cannot fetch complete celebration parent documents", async () => {
  const rules = await source("firestore.rules");
  assert.doesNotMatch(rules, /allow get:\s*if resource\.data\.isActive/);
  assert.match(rules, /allow read:\s*if request\.auth != null/);
  assert.match(rules, /match \/reactions\/\{reactionId\}/);
  assert.match(rules, /match \/rsvps\/\{rsvpId\}/);
});

test("browser uploads use signed authorization instead of unsigned presets", async () => {
  const uploadSources = await Promise.all([
    source("apps/web/app/dashboard/create/page.tsx"),
    source("apps/web/app/contribute/[id]/[token]/page.tsx"),
    source("apps/web/app/admin/page.tsx"),
    source("apps/web/components/wedding/WeddingCreatorFields.tsx"),
  ]);
  for (const uploadSource of uploadSources) {
    assert.doesNotMatch(uploadSource, /upload_preset|NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET/);
  }
  assert.match(uploadSources.join("\n"), /uploadCloudinaryFile\(/);
});
