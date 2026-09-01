import assert from "node:assert/strict";
import test from "node:test";
import {
  isAllowedCloudinaryUrl,
  isValidCloudinaryUploadResult,
  uploadPolicyFor,
  validateUploadFile,
} from "../../apps/web/lib/cloudinary-policy.ts";

test("upload policy rejects unsupported purposes and unsafe image types", () => {
  assert.equal(uploadPolicyFor("rawFile"), null);
  assert.match(validateUploadFile({ type: "image/svg+xml", size: 100 }, "celebrationPhoto"), /not supported/);
  assert.match(validateUploadFile({ type: "image/jpeg", size: 9 * 1024 * 1024 }, "celebrationPhoto"), /smaller than 8 MB/);
  assert.equal(validateUploadFile({ type: "image/webp", size: 1024 }, "celebrationPhoto"), null);
});

test("Cloudinary responses must match the configured cloud, folder, type, size, and format", () => {
  const valid = {
    secure_url: "https://res.cloudinary.com/demo/image/upload/v1788241006/birthdayglow/photos/photo.jpg",
    bytes: 1024,
    format: "jpg",
    resource_type: "image",
  };
  assert.equal(isValidCloudinaryUploadResult(valid, "celebrationPhoto", "demo"), true);
  assert.equal(isValidCloudinaryUploadResult({ ...valid, format: "svg" }, "celebrationPhoto", "demo"), false);
  assert.equal(isValidCloudinaryUploadResult({ ...valid, secure_url: "https://example.com/photo.jpg" }, "celebrationPhoto", "demo"), false);
  assert.equal(isValidCloudinaryUploadResult({ ...valid, bytes: 20 * 1024 * 1024 }, "celebrationPhoto", "demo"), false);
});

test("stored media URLs are restricted to the signed purpose folder", () => {
  assert.equal(isAllowedCloudinaryUrl(
    "https://res.cloudinary.com/demo/image/upload/v1788241006/birthdayglow/contributions/memory.webp",
    "contributionPhoto",
    "demo",
  ), true);
  assert.equal(isAllowedCloudinaryUrl(
    "https://res.cloudinary.com/demo/image/upload/other/private.webp",
    "contributionPhoto",
    "demo",
  ), false);
  assert.equal(isAllowedCloudinaryUrl(
    "https://res.cloudinary.com/demo/image/upload/birthdayglow/contributions/memory.svg",
    "contributionPhoto",
    "demo",
  ), false);
});