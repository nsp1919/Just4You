export const VIEW_COOKIE_MAX_AGE_SECONDS = 60 * 60;

export function viewCookieName(slug: string): string {
  return `vw_${slug}`;
}

export function isBotUserAgent(userAgent: string): boolean {
  return /bot|crawl|spider|slurp|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegram/i.test(userAgent);
}

export function viewSourceFromReferrer(referrer: string): string {
  if (!referrer) return "direct";

  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (/wa\.me|whatsapp/.test(host)) return "whatsapp";
    if (/instagram/.test(host)) return "instagram";
    if (/facebook|fb\./.test(host)) return "facebook";
    return host.slice(0, 120);
  } catch {
    return "other";
  }
}