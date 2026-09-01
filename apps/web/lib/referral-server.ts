import { randomUUID } from "crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import {
  COLLECTIONS,
  FEATURE_ADDONS,
  REFERRAL_MILESTONE_COUNT,
  REFERRAL_REWARD_INR,
  MAX_WEDDING_CEREMONIES,
  computeWeddingPriceInr,
  computePricePaise,
  normalizeVanitySlug,
  type PricingSettings,
} from "@/lib/constants";
import { normalizeReferralCode } from "@/lib/referral-code";
import { calculateWalletCheckout } from "@/lib/wallet-checkout";
import { creditWithdrawableEarnings, debitWalletForCheckout, resolveWithdrawableBalance } from "@/lib/wallet-withdrawal";
import { getWalletSettings } from "@/lib/wallet-settings";
import { getPricingSettings } from "@/lib/pricing-settings";

export interface CheckoutBenefits {
  reservationId: string;
  basePaise: number;
  amountPaise: number;
  referralDiscountPaise: number;
  walletAppliedInr: number;
  freeAddonFeatureId: string | null;
  freeAddonDiscountPaise: number;
  referredBy: string | null;
}

export type CheckoutBenefitsPreview = Omit<CheckoutBenefits, "reservationId" | "referredBy">;

function bestFreeAddon(features: string[], pricing: PricingSettings): { id: string; pricePaise: number } | null {
  const selected = FEATURE_ADDONS.filter((addon) => features.includes(addon.id));
  if (selected.length === 0) return null;
  const addon = selected.reduce((best, candidate) =>
    pricing.addonPrices[candidate.id] > pricing.addonPrices[best.id] ? candidate : best
  );
  return { id: addon.id, pricePaise: pricing.addonPrices[addon.id] * 100 };
}

function calculateCheckoutBenefits(
  user: FirebaseFirestore.DocumentData | undefined,
  features: string[],
  basePaise: number,
  allowFreeAddon: boolean,
  pricing: PricingSettings,
): CheckoutBenefitsPreview {
  const freeAddonCredits = Math.max(0, Number(user?.freeAddonCredits) || 0);
  const freeAddon = allowFreeAddon && freeAddonCredits > 0 ? bestFreeAddon(features, pricing) : null;
  const walletBalance = Math.max(0, Number(user?.walletBalance ?? user?.referralCredits) || 0);
  const payment = calculateWalletCheckout(basePaise, walletBalance, freeAddon?.pricePaise ?? 0);

  return {
    basePaise,
    amountPaise: payment.amountPaise,
    referralDiscountPaise: 0,
    walletAppliedInr: payment.walletAppliedInr,
    freeAddonFeatureId: freeAddon?.id ?? null,
    freeAddonDiscountPaise: payment.freeAddonDiscountPaise,
  };
}

function authoritativeCheckoutPrice(
  celebration: FirebaseFirestore.DocumentData,
  features: string[],
  pricing: PricingSettings,
): { basePaise: number; allowFreeAddon: boolean } {
  if (celebration.occasionType !== "wedding") {
    return { basePaise: computePricePaise(features, pricing), allowFreeAddon: true };
  }

  const ceremonies = Array.isArray(celebration.weddingData?.ceremonies)
    ? celebration.weddingData.ceremonies
    : [];
  if (ceremonies.length === 0 || ceremonies.length > MAX_WEDDING_CEREMONIES) {
    throw new Error("INVALID_WEDDING_CEREMONY_COUNT");
  }

  const customMusicCount = ceremonies.filter((ceremony: any) => Boolean(ceremony?.revealMusicUrl)).length;
  const basePaise = computeWeddingPriceInr({
    ceremonyCount: ceremonies.length,
    rsvpEnabled: celebration.weddingData?.rsvpEnabled === true,
    customMusicCount,
  }, pricing) * 100;

  return { basePaise, allowFreeAddon: false };
}

export async function previewCheckoutBenefits(
  userId: string,
  celebrationId: string,
  features: string[],
): Promise<CheckoutBenefitsPreview> {
  const userRef = adminDb.collection(COLLECTIONS.USERS).doc(userId);
  const celebRef = adminDb.collection(COLLECTIONS.CELEBRATIONS).doc(celebrationId);
  const [userSnap, celebSnap] = await Promise.all([userRef.get(), celebRef.get()]);
  const pricingSettings = await getPricingSettings();
  const celebration = celebSnap.data();

  if (!userSnap.exists) throw new Error("USER_PROFILE_REQUIRED");
  if (!celebSnap.exists || celebration?.userId !== userId) throw new Error("CHECKOUT_NOT_FOUND");
  if (celebration?.paymentStatus === "paid") throw new Error("ALREADY_PAID");

  if (celebration?.referralBenefitsStatus === "reserved") {
    return {
      basePaise: Number(celebration.pricePaise) || computePricePaise(features, pricingSettings),
      amountPaise: Math.max(100, Number(celebration.chargedPaise) || computePricePaise(features, pricingSettings)),
      referralDiscountPaise: Math.max(0, Number(celebration.referralDiscountPaise) || 0),
      walletAppliedInr: Math.max(
        0,
        Number(celebration.walletAppliedInr ?? celebration.referralCreditAppliedInr) || 0,
      ),
      freeAddonFeatureId: celebration.freeAddonFeatureId ?? null,
      freeAddonDiscountPaise: Math.max(0, Number(celebration.freeAddonDiscountPaise) || 0),
    };
  }

  const pricing = authoritativeCheckoutPrice(celebration!, features, pricingSettings);
  return calculateCheckoutBenefits(userSnap.data(), features, pricing.basePaise, pricing.allowFreeAddon, pricingSettings);
}

export async function reserveCheckoutBenefits(
  userId: string,
  celebrationId: string,
  features: string[],
): Promise<CheckoutBenefits> {
  const userRef = adminDb.collection(COLLECTIONS.USERS).doc(userId);
  const celebRef = adminDb.collection(COLLECTIONS.CELEBRATIONS).doc(celebrationId);
  const userBefore = await userRef.get();
  if (!userBefore.exists) throw new Error("USER_PROFILE_REQUIRED");
  const pricingSettings = await getPricingSettings();

  const referredBy = normalizeReferralCode(userBefore.data()?.referredBy);
  const [referrerMatch, paidMatch] = await Promise.all([
    referredBy
      ? adminDb.collection(COLLECTIONS.USERS).where("referralCode", "==", referredBy).limit(1).get()
      : Promise.resolve(null),
    adminDb
      .collection(COLLECTIONS.CELEBRATIONS)
      .where("userId", "==", userId)
      .where("paymentStatus", "==", "paid")
      .limit(1)
      .get(),
  ]);
  const validReferrer = referrerMatch?.docs[0];
  const friendEligible = Boolean(
    referredBy &&
      validReferrer &&
      validReferrer.id !== userId &&
      userBefore.data()?.referralRedeemed !== true &&
      paidMatch.empty
  );

  return adminDb.runTransaction(async (transaction) => {
    const [userSnap, celebSnap] = await Promise.all([
      transaction.get(userRef),
      transaction.get(celebRef),
    ]);
    const user = userSnap.data();
    const celebration = celebSnap.data();
    if (!userSnap.exists || !celebSnap.exists || celebration?.userId !== userId) {
      throw new Error("CHECKOUT_NOT_FOUND");
    }
    if (celebration?.paymentStatus === "paid") throw new Error("ALREADY_PAID");
    const walletBalance = Math.max(0, Number(user?.walletBalance ?? user?.referralCredits) || 0);
    const freeAddonCredits = Math.max(0, Number(user?.freeAddonCredits) || 0);
    if (celebration?.referralBenefitsStatus === "reserved") {
      throw new Error("CHECKOUT_ALREADY_PENDING");
    }

    const checkoutFeatures = Array.isArray(celebration?.selectedFeatures)
      ? [...new Set(celebration.selectedFeatures.filter((feature: unknown): feature is string => typeof feature === "string"))]
      : features;
    if (checkoutFeatures.includes("hosting_3yr") && checkoutFeatures.includes("hosting_lifetime")) {
      throw new Error("MULTIPLE_HOSTING_TIERS");
    }

    const checkoutVanitySlug = checkoutFeatures.includes("custom_link")
      ? normalizeVanitySlug(celebration?.vanitySlug)
      : "";
    if (checkoutFeatures.includes("custom_link") && checkoutVanitySlug.length < 3) {
      throw new Error("INVALID_CUSTOM_LINK");
    }

    const vanityRef = checkoutVanitySlug
      ? adminDb.collection("vanityLinks").doc(checkoutVanitySlug)
      : null;
    const vanitySnap = vanityRef ? await transaction.get(vanityRef) : null;
    if (vanitySnap?.exists && vanitySnap.data()?.celebrationId !== celebrationId) {
      throw new Error("CUSTOM_LINK_TAKEN");
    }

    const pricing = authoritativeCheckoutPrice(celebration!, checkoutFeatures, pricingSettings);
    const benefits = calculateCheckoutBenefits(user, checkoutFeatures, pricing.basePaise, pricing.allowFreeAddon, pricingSettings);
    const withdrawableBalance = resolveWithdrawableBalance(user ?? {}, REFERRAL_REWARD_INR);
    const walletAfterCheckout = debitWalletForCheckout(
      walletBalance,
      withdrawableBalance,
      benefits.walletAppliedInr,
    );
    const freeAddon = benefits.freeAddonFeatureId;
    const reservationId = randomUUID();
    transaction.update(userRef, {
      walletBalance: walletAfterCheckout.walletBalance,
      walletWithdrawableBalance: walletAfterCheckout.walletWithdrawableBalance,
      freeAddonCredits: freeAddonCredits - (freeAddon ? 1 : 0),
    });
    if (vanityRef) {
      transaction.set(vanityRef, {
        celebrationId,
        userId,
        reservedAt: Timestamp.now(),
      });
    }
    transaction.update(celebRef, {
      pricePaise: benefits.basePaise,
      chargedPaise: benefits.amountPaise,
      referralDiscountPaise: benefits.referralDiscountPaise,
      referralCreditAppliedInr: FieldValue.delete(),
      walletAppliedInr: benefits.walletAppliedInr,
      walletWithdrawableAppliedInr: withdrawableBalance - walletAfterCheckout.walletWithdrawableBalance,
      freeAddonFeatureId: freeAddon ?? FieldValue.delete(),
      freeAddonDiscountPaise: benefits.freeAddonDiscountPaise,
      referredBy: friendEligible && referredBy ? referredBy : FieldValue.delete(),
      referralBenefitReservationId: reservationId,
      referralBenefitsStatus: "reserved",
      referralBenefitsReservedAt: Timestamp.now(),
      checkoutFeatures,
      checkoutVanitySlug: checkoutVanitySlug || FieldValue.delete(),
    });

    return {
      reservationId,
      ...benefits,
      referredBy: friendEligible ? referredBy : null,
    };
  });
}

export async function releaseCheckoutBenefits(
  celebrationId: string,
  reservationId?: string,
): Promise<void> {
  const celebRef = adminDb.collection(COLLECTIONS.CELEBRATIONS).doc(celebrationId);
  await adminDb.runTransaction(async (transaction) => {
    const celebSnap = await transaction.get(celebRef);
    const celebration = celebSnap.data();
    if (!celebration || celebration.referralBenefitsStatus !== "reserved") return;
    if (reservationId && celebration.referralBenefitReservationId !== reservationId) return;

    const userRef = adminDb.collection(COLLECTIONS.USERS).doc(celebration.userId);
    const vanityRef = celebration.checkoutVanitySlug
      ? adminDb.collection("vanityLinks").doc(celebration.checkoutVanitySlug)
      : null;
    const [userSnap, vanitySnap] = await Promise.all([
      transaction.get(userRef),
      vanityRef ? transaction.get(vanityRef) : Promise.resolve(null),
    ]);
    if (userSnap.exists) {
      const currentWalletBalance = Math.max(
        0,
        Number(userSnap.data()?.walletBalance ?? userSnap.data()?.referralCredits) || 0,
      );
      const reservedWallet = Math.max(
        0,
        Number(celebration.walletAppliedInr ?? celebration.referralCreditAppliedInr) || 0,
      );
      const reservedWithdrawableWallet = Math.max(
        0,
        Number(celebration.walletWithdrawableAppliedInr) || 0,
      );
      const currentWithdrawableBalance = resolveWithdrawableBalance(
        userSnap.data() ?? {},
        REFERRAL_REWARD_INR,
      );
      const userUpdate: Record<string, unknown> = {
        walletBalance: currentWalletBalance + reservedWallet,
        walletWithdrawableBalance: currentWithdrawableBalance + reservedWithdrawableWallet,
        freeAddonCredits: FieldValue.increment(celebration.freeAddonFeatureId ? 1 : 0),
      };
      if (userSnap.data()?.referralDiscountReservationCelebrationId === celebrationId) {
        userUpdate.referralDiscountReservationCelebrationId = FieldValue.delete();
      }
      transaction.update(userRef, userUpdate);
    }
    if (vanityRef && vanitySnap?.data()?.celebrationId === celebrationId) {
      transaction.delete(vanityRef);
    }
    transaction.update(celebRef, {
      referralBenefitsStatus: "released",
      referralBenefitsReleasedAt: Timestamp.now(),
      checkoutFeatures: FieldValue.delete(),
      checkoutVanitySlug: FieldValue.delete(),
    });
  });
}

export async function settlePaidReferralBenefits(celebrationId: string): Promise<void> {
  const { referrerRewardInr } = await getWalletSettings();
  const celebRef = adminDb.collection(COLLECTIONS.CELEBRATIONS).doc(celebrationId);
  const before = await celebRef.get();
  const celebrationBefore = before.data();
  if (!celebrationBefore?.userId) return;

  const referredBy = normalizeReferralCode(celebrationBefore.referredBy);
  const referrerMatch = referredBy
    ? await adminDb.collection(COLLECTIONS.USERS).where("referralCode", "==", referredBy).limit(1).get()
    : null;
  const referrerRef = referrerMatch?.docs[0]?.ref;
  const buyerRef = adminDb.collection(COLLECTIONS.USERS).doc(celebrationBefore.userId);

  await adminDb.runTransaction(async (transaction) => {
    const reads = [transaction.get(celebRef), transaction.get(buyerRef)];
    if (referrerRef) reads.push(transaction.get(referrerRef));
    const [celebSnap, buyerSnap, referrerSnap] = await Promise.all(reads);
    const celebration = celebSnap.data();
    const buyer = buyerSnap.data();
    if (!celebration || celebration.referralRewardSettled === true) return;

    const celebrationUpdate: Record<string, unknown> = {
      referralRewardSettled: true,
      referralBenefitsStatus:
        celebration.referralBenefitsStatus === "reserved" ? "consumed" : celebration.referralBenefitsStatus ?? "none",
      referralBenefitsSettledAt: Timestamp.now(),
    };

    if (
      buyerSnap.exists &&
      buyer?.referralRedeemed !== true &&
      referrerRef &&
      referrerSnap?.exists &&
      referrerRef.id !== buyerRef.id
    ) {
      const newCount = (Number(referrerSnap.data()?.referralCount) || 0) + 1;
      const referrerWalletBalance = Math.max(
        0,
        Number(referrerSnap.data()?.walletBalance ?? referrerSnap.data()?.referralCredits) || 0,
      );
      const referrerBalances = creditWithdrawableEarnings(
        referrerWalletBalance,
        resolveWithdrawableBalance(referrerSnap.data() ?? {}, REFERRAL_REWARD_INR),
        referrerRewardInr,
      );
      const referrerUpdate: Record<string, unknown> = {
        ...referrerBalances,
        referralCount: FieldValue.increment(1),
      };
      if (newCount % REFERRAL_MILESTONE_COUNT === 0) {
        referrerUpdate.freeAddonCredits = FieldValue.increment(1);
      }
      transaction.update(referrerRef, referrerUpdate);
      transaction.update(buyerRef, {
        referralRedeemed: true,
        referralDiscountReservationCelebrationId: FieldValue.delete(),
      });
      celebrationUpdate.referralRewardInr = referrerRewardInr;
    }

    transaction.update(celebRef, celebrationUpdate);
  });
}