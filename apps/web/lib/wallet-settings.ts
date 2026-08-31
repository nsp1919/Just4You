import "server-only";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, REFERRAL_JOIN_WALLET_BONUS_INR, REFERRAL_REWARD_INR } from "@/lib/constants";
import { MIN_WALLET_WITHDRAWAL_INR } from "@/lib/wallet-withdrawal";

export const MIN_ALLOWED_WITHDRAWAL_INR = 100;
export const MAX_ALLOWED_WITHDRAWAL_INR = 10_000;
export const MIN_ALLOWED_REFERRAL_AMOUNT_INR = 0;
export const MAX_ALLOWED_REFERRAL_AMOUNT_INR = 10_000;

export interface WalletSettings {
  minimumWithdrawalInr: number;
  referrerRewardInr: number;
  joinBonusInr: number;
}

function boundedInteger(value: unknown, min: number, max: number, fallback: number): number {
  const configured = Math.floor(Number(value));
  return Number.isFinite(configured) ? Math.max(min, Math.min(max, configured)) : fallback;
}

export async function getWalletSettings(): Promise<WalletSettings> {
  const snapshot = await adminDb.collection(COLLECTIONS.APP_CONFIG).doc("walletSettings").get();
  const data = snapshot.data();
  return {
    minimumWithdrawalInr: boundedInteger(data?.minimumWithdrawalInr, MIN_ALLOWED_WITHDRAWAL_INR, MAX_ALLOWED_WITHDRAWAL_INR, MIN_WALLET_WITHDRAWAL_INR),
    referrerRewardInr: boundedInteger(data?.referrerRewardInr, MIN_ALLOWED_REFERRAL_AMOUNT_INR, MAX_ALLOWED_REFERRAL_AMOUNT_INR, REFERRAL_REWARD_INR),
    joinBonusInr: boundedInteger(data?.joinBonusInr, MIN_ALLOWED_REFERRAL_AMOUNT_INR, MAX_ALLOWED_REFERRAL_AMOUNT_INR, REFERRAL_JOIN_WALLET_BONUS_INR),
  };
}

export async function getMinimumWithdrawalInr(): Promise<number> {
  return (await getWalletSettings()).minimumWithdrawalInr;
}