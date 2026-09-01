import { normalizeVanitySlug } from "@/lib/constants";

export function getCelebrationUrl(slug: string, vanitySlug?: unknown): string {
  const vanity = normalizeVanitySlug(vanitySlug);
  if (vanity) {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://just4you.buzz").replace(/\/$/, "");
    return `${appUrl}/p/${vanity}`;
  }

  const birthdayUrl = (process.env.NEXT_PUBLIC_BIRTHDAY_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://just4you.buzz").replace(/\/$/, "");
  return `${birthdayUrl}/wish/${slug}`;
}