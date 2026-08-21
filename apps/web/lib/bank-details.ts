import crypto from "node:crypto";

function encryptionKey(): Buffer {
  const secret = process.env.WALLET_BANK_ENCRYPTION_KEY?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("BANK_ENCRYPTION_NOT_CONFIGURED");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptBankAccount(accountNumber: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(accountNumber, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(":");
}

export function decryptBankAccount(payload: string): string {
  const [version, iv, tag, encrypted] = payload.split(":");
  if (version !== "v1" || !iv || !tag || !encrypted) throw new Error("INVALID_BANK_ACCOUNT_DATA");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}