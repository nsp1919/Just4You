import "server-only";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { MIN_WALLET_WITHDRAWAL_INR } from "@/lib/wallet-withdrawal";

export const MIN_ALLOWED_WITHDRAWAL_INR = 100;
export const MAX_ALLOWED_WITHDRAWAL_INR = 10_000;

export async function getMinimumWithdrawalInr(): Promise<number> {
  const snapshot = await adminDb.collection(COLLECTIONS.APP_CONFIG).doc("walletSettings").get();
  const configured = Math.floor(Number(snapshot.data()?.minimumWithdrawalInr));
  return Number.isFinite(configured)
    ? Math.max(MIN_ALLOWED_WITHDRAWAL_INR, Math.min(MAX_ALLOWED_WITHDRAWAL_INR, configured))
    : MIN_WALLET_WITHDRAWAL_INR;
}