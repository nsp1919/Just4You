import "server-only";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, OCCASIONS } from "@/lib/constants";

export interface PublicCelebrationProof {
  slug: string;
  recipientName: string;
  occasionLabel: string;
  occasionEmoji: string;
  theme: string;
  photoUrl: string;
  views: number;
  reviewMediaUrl: string;
  reviewMediaType: "image" | "video" | null;
}

function cleanString(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isCloudinaryUrl(value: string): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

export async function getPublicCelebrationProof(limit = 3): Promise<PublicCelebrationProof[]> {
  try {
    const snapshot = await adminDb
      .collection(COLLECTIONS.CELEBRATIONS)
      .where("galleryApproved", "==", true)
      .where("isActive", "==", true)
      .limit(30)
      .get();

    return snapshot.docs
      .map((document) => {
        const data = document.data();
        const occasion = OCCASIONS.find((item) => item.id === data.occasionType) ?? OCCASIONS[0];
        const reviewMediaUrl = data.reviewVerified === true
          ? cleanString(data.reviewMediaUrl, 2048)
          : "";
        const reviewMediaType = reviewMediaUrl && isCloudinaryUrl(reviewMediaUrl)
          && (data.reviewMediaType === "image" || data.reviewMediaType === "video")
          ? data.reviewMediaType
          : null;

        return {
          slug: cleanString(data.slug, 120),
          recipientName: cleanString(data.recipientName, 80),
          occasionLabel: occasion.label,
          occasionEmoji: occasion.emoji,
          theme: cleanString(data.theme, 40),
          photoUrl: cleanString(data.photos?.[0], 2048),
          views: typeof data.views === "number" ? Math.max(0, data.views) : 0,
          reviewMediaUrl: reviewMediaType ? reviewMediaUrl : "",
          reviewMediaType,
          isPublicOptIn: data.isPublicOptIn === true,
          isBlocked: data.isBlocked === true,
        };
      })
      .filter((item) => item.slug && item.recipientName && item.isPublicOptIn && !item.isBlocked)
      .sort((left, right) => right.views - left.views)
      .slice(0, Math.max(0, limit))
      .map(({ isPublicOptIn: _isPublicOptIn, isBlocked: _isBlocked, ...item }) => item);
  } catch (error) {
    console.error("public proof query failed:", error);
    return [];
  }
}