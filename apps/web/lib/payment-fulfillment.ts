import { customAlphabet } from "nanoid";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { Resend } from "resend";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, hostingExpiryDateFor } from "@/lib/constants";
import { getCelebrationUrl } from "@/lib/celebration-url";
import { notifyAdminOfPaidOrder } from "@/lib/order-notification";
import { settlePaidReferralBenefits } from "@/lib/referral-server";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);
const MAX_SLUG_ATTEMPTS = 5;
const EMAIL_CLAIM_TIMEOUT_MS = 10 * 60 * 1000;

interface FulfillmentResult {
  slug: string;
  vanitySlug: string;
  url: string;
  activated: boolean;
}

interface ActivationResult extends FulfillmentResult {
  celebration: FirebaseFirestore.DocumentData;
  expiresAt: Timestamp | null;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function confirmationEmail(
  celebration: FirebaseFirestore.DocumentData,
  url: string,
  expiresAt: Timestamp | null,
): { subject: string; html: string } {
  const occasion = celebration.occasionType || "birthday";
  const occasionEmoji = occasion === "anniversary" ? "💍" : occasion === "proposal" ? "💌" : occasion === "kids-birthday" ? "🧸" : "🎂";
  const occasionLabel = occasion === "anniversary" ? "Anniversary" : occasion === "proposal" ? "Proposal" : occasion === "kids-birthday" ? "Kids Birthday" : "Birthday";
  const recipientName = escapeHtml(celebration.recipientName);
  const safeUrl = escapeHtml(url);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${occasionEmoji} I created a beautiful ${occasionLabel.toLowerCase()} surprise website for you!\n\nVisit: ${url}`)}`;
  const hostingMessage = expiresAt
    ? `This website will stay live until ${expiresAt.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.`
    : "Lifetime Hosting is active, so this website has no automatic expiry while Just4You continues operating the hosting service.";

  return {
    subject: `${occasionEmoji} Your Just4You website is ready! - ${String(celebration.recipientName ?? "Your")} ${occasionLabel}`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Your Just4You Website is Live</title></head><body style="margin:0;padding:0;background:#0a0612;font-family:Segoe UI,sans-serif;color:#f8f4ff"><div style="max-width:600px;margin:0 auto;padding:40px 20px"><div style="text-align:center;font-size:48px">${occasionEmoji}</div><div style="background:#18101e;border:1px solid rgba(168,85,247,.2);border-radius:24px;padding:32px"><h1 style="text-align:center">Your website is live!</h1><p style="color:#b9a6be;text-align:center">The surprise website for <strong style="color:#f8f4ff">${recipientName}</strong> is ready to share.</p><p style="text-align:center;word-break:break-all"><a href="${safeUrl}" style="color:#c084fc">${safeUrl}</a></p><p style="text-align:center"><a href="${safeUrl}" style="display:inline-block;background:#9333ea;color:white;text-decoration:none;padding:16px 32px;border-radius:9999px;font-weight:600">View surprise website</a></p><p style="text-align:center"><a href="${escapeHtml(whatsappUrl)}" style="color:#25d366">Share on WhatsApp</a></p></div><p style="text-align:center;color:#9b8ec4;font-size:12px">${escapeHtml(hostingMessage)}<br>Made with love by Just4You</p></div></body></html>`,
  };
}

async function activateCelebration(
  celebrationId: string,
  paymentId: string | undefined,
): Promise<ActivationResult> {
  const celebrationRef = adminDb.collection(COLLECTIONS.CELEBRATIONS).doc(celebrationId);

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const candidate = nanoid();
    const slugRef = adminDb.collection("celebrationSlugs").doc(candidate);
    const legacySlugQuery = adminDb
      .collection(COLLECTIONS.CELEBRATIONS)
      .where("slug", "==", candidate)
      .limit(1);
    const result = await adminDb.runTransaction(async (transaction): Promise<ActivationResult | null> => {
      const [celebrationSnapshot, slugSnapshot, legacySlugSnapshot] = await Promise.all([
        transaction.get(celebrationRef),
        transaction.get(slugRef),
        transaction.get(legacySlugQuery),
      ]);
      if (!celebrationSnapshot.exists) throw new Error("CELEBRATION_NOT_FOUND");

      const celebration = celebrationSnapshot.data()!;
      if (celebration.paymentStatus === "paid" && celebration.isActive === true && celebration.slug) {
        const vanitySlug = celebration.checkoutVanitySlug ?? celebration.vanitySlug ?? "";
        return {
          celebration,
          slug: celebration.slug,
          vanitySlug,
          url: getCelebrationUrl(celebration.slug, vanitySlug),
          expiresAt: celebration.expiresAt ?? null,
          activated: false,
        };
      }
      if (slugSnapshot.exists || !legacySlugSnapshot.empty) return null;

      const hostingFeatures: string[] = Array.isArray(celebration.checkoutFeatures)
        ? celebration.checkoutFeatures
        : Array.isArray(celebration.selectedFeatures)
          ? celebration.selectedFeatures
          : [];
      const expiryDate = hostingExpiryDateFor(hostingFeatures);
      const expiresAt = expiryDate ? Timestamp.fromDate(expiryDate) : null;
      const vanitySlug = celebration.checkoutVanitySlug ?? "";
      transaction.create(slugRef, {
        celebrationId,
        createdAt: Timestamp.now(),
      });
      transaction.update(celebrationRef, {
        slug: candidate,
        ...(paymentId ? { razorpayPaymentId: paymentId } : {}),
        paymentStatus: "paid",
        isActive: true,
        expiresAt,
        selectedFeatures: hostingFeatures,
        vanitySlug,
        paymentFulfilledAt: Timestamp.now(),
      });

      return {
        celebration,
        slug: candidate,
        vanitySlug,
        url: getCelebrationUrl(candidate, vanitySlug),
        expiresAt,
        activated: true,
      };
    });

    if (result) return result;
  }

  throw new Error("SLUG_GENERATION_FAILED");
}

async function sendCustomerConfirmation(
  celebrationId: string,
  activation: ActivationResult,
  fallbackEmail?: string,
): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!resendKey || !fromEmail) return;

  let customerEmail = fallbackEmail;
  try {
    if (activation.celebration.userId) {
      const user = await adminAuth.getUser(activation.celebration.userId);
      customerEmail = user.email ?? customerEmail;
    }
  } catch (error) {
    console.error("payment fulfillment: unable to resolve customer email", error);
  }
  if (!customerEmail) return;

  const celebrationRef = adminDb.collection(COLLECTIONS.CELEBRATIONS).doc(celebrationId);
  const claimed = await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(celebrationRef);
    const data = snapshot.data();
    if (!snapshot.exists || data?.customerConfirmationEmailSentAt) return false;
    const claimedAt = data?.customerConfirmationEmailClaimedAt;
    if (claimedAt?.toMillis && Date.now() - claimedAt.toMillis() < EMAIL_CLAIM_TIMEOUT_MS) return false;
    transaction.update(celebrationRef, { customerConfirmationEmailClaimedAt: Timestamp.now() });
    return true;
  });
  if (!claimed) return;

  try {
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: fromEmail,
      to: customerEmail,
      ...confirmationEmail(activation.celebration, activation.url, activation.expiresAt),
    });
    await celebrationRef.update({
      customerConfirmationEmailSentAt: Timestamp.now(),
      customerConfirmationEmailClaimedAt: FieldValue.delete(),
    });
  } catch (error) {
    await celebrationRef.update({ customerConfirmationEmailClaimedAt: FieldValue.delete() }).catch(() => undefined);
    console.error("payment fulfillment: customer confirmation failed", error);
  }
}

export async function fulfillCelebrationPayment(
  celebrationId: string,
  paymentId?: string,
  customerEmail?: string,
): Promise<FulfillmentResult> {
  const activation = await activateCelebration(celebrationId, paymentId);

  try {
    await settlePaidReferralBenefits(celebrationId);
  } catch (error) {
    console.error("payment fulfillment: referral settlement failed", error);
  }

  await Promise.all([
    notifyAdminOfPaidOrder(celebrationId, customerEmail),
    sendCustomerConfirmation(celebrationId, activation, customerEmail),
  ]);

  return {
    slug: activation.slug,
    vanitySlug: activation.vanitySlug,
    url: activation.url,
    activated: activation.activated,
  };
}