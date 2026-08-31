"use client";

import { useEffect, useState } from "react";
import { REFERRAL_JOIN_WALLET_BONUS_INR, REFERRAL_REWARD_INR } from "@/lib/constants";

export interface ReferralRewards {
  referrerRewardInr: number;
  joinBonusInr: number;
}

const DEFAULT_REWARDS: ReferralRewards = {
  referrerRewardInr: REFERRAL_REWARD_INR,
  joinBonusInr: REFERRAL_JOIN_WALLET_BONUS_INR,
};

function validAmount(value: unknown, fallback: number): number {
  const amount = Number(value);
  return Number.isInteger(amount) && amount >= 0 ? amount : fallback;
}

export function useReferralRewards(): ReferralRewards {
  const [rewards, setRewards] = useState<ReferralRewards>(DEFAULT_REWARDS);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/referral/settings")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load referral settings")))
      .then((result) => {
        if (!cancelled) {
          setRewards({
            referrerRewardInr: validAmount(result.referrerRewardInr, DEFAULT_REWARDS.referrerRewardInr),
            joinBonusInr: validAmount(result.joinBonusInr, DEFAULT_REWARDS.joinBonusInr),
          });
        }
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  return rewards;
}