import crypto from "node:crypto";

export function signaturesMatch(expected: string, received: unknown): boolean {
  if (typeof received !== "string" || !/^[0-9a-f]+$/i.test(expected) || !/^[0-9a-f]+$/i.test(received)) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");
  return expectedBuffer.length === receivedBuffer.length
    && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function verifyRazorpayPaymentSignature(
  orderId: unknown,
  paymentId: unknown,
  signature: unknown,
  secret: string,
): boolean {
  if (typeof orderId !== "string" || typeof paymentId !== "string") return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return signaturesMatch(expected, signature);
}