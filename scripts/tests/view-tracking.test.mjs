import assert from "node:assert/strict";
import test from "node:test";
import {
  isBotUserAgent,
  viewCookieName,
  viewSourceFromReferrer,
} from "../../apps/birthday/lib/view-tracking.ts";

test("view cookies are scoped by celebration slug", () => {
  assert.equal(viewCookieName("abc12345"), "vw_abc12345");
});

test("social referrers are normalized for creator analytics", () => {
  assert.equal(viewSourceFromReferrer("https://wa.me/123"), "whatsapp");
  assert.equal(viewSourceFromReferrer("https://www.instagram.com/p/example"), "instagram");
  assert.equal(viewSourceFromReferrer("https://m.facebook.com/story"), "facebook");
  assert.equal(viewSourceFromReferrer(""), "direct");
  assert.equal(viewSourceFromReferrer("not a URL"), "other");
});

test("known preview and crawler user agents are excluded", () => {
  assert.equal(isBotUserAgent("Mozilla/5.0 Chrome/140.0"), false);
  assert.equal(isBotUserAgent("WhatsApp/2.0"), true);
  assert.equal(isBotUserAgent("Googlebot/2.1"), true);
});