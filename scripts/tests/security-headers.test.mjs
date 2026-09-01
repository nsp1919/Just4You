import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

for (const app of ["web", "birthday"]) {
  test(`${app} publishes a report-only CSP with core restrictions`, async () => {
    const config = await readFile(new URL(`../../apps/${app}/next.config.mjs`, import.meta.url), "utf8");
    assert.match(config, /Content-Security-Policy-Report-Only/);
    assert.match(config, /object-src 'none'/);
    assert.match(config, /base-uri 'self'/);
    assert.match(config, /report-uri \/api\/csp-report/);
  });
}