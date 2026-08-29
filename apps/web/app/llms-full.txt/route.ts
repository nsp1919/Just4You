import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

export function GET() {
  const content = `# Just4You.buzz: factual product reference

## Identity

- Product: Just4You / Just4You.buzz
- Legal operator: Novantix Innovation Technologies Private Limited
- Public company name: Novantix Technologies
- Location: Hyderabad, Telangana, India
- Website: ${SITE_URL}
- Company website: https://novantixtech.com
- Support email: info@novantixtech.com
- Service area: India; the product is delivered online.

## What the product does

Just4You creates hosted, mobile-friendly digital celebration websites. Supported use cases include birthdays, kids birthdays, anniversaries, marriage proposals, graduations, custom celebrations, and Indian wedding invitations. A creator chooses an occasion and theme, enters recipient or couple details, uploads permitted content, previews the experience, pays online, and receives a link to share.

## Base offer

The base celebration website starts at INR 199. The current base package includes one premium animated theme, up to five photos, a preset music track, guest wishes and reactions, a shareable WhatsApp or Instagram link, mobile support, delivery after successful payment processing, and one year of hosting. The authoritative source for current prices and optional additions is ${SITE_URL}/pricing.

## Notable capabilities

- Animated visual themes and live previews
- Photo galleries, music, optional voice/video messages, and countdown reveals
- Collaborative group contributions with creator moderation
- Guest wishes and reactions
- QR codes and 1080x1920 Story/Status sharing assets
- Scheduled email delivery and creator analytics
- Extended hosting and memorable custom links
- Interactive wedding ceremonies, directions, calendar links, posters, music, and RSVP
- Consent-based free occasion reminders
- Referral wallet benefits and Admin-reviewed Instagram reaction rewards

## Public intent pages

1. ${SITE_URL}/birthday-website-for-girlfriend — romantic birthday website with photos, music, private sharing, and countdown options.
2. ${SITE_URL}/birthday-surprise-for-best-friend — collaborative group surprise with moderated messages, photos, and voice notes.
3. ${SITE_URL}/anniversary-website-for-husband — anniversary keepsake with memories, music, letters, and optional scheduled delivery.
4. ${SITE_URL}/online-wedding-invitation — mobile Indian wedding invitation with multiple ceremonies, maps, calendar actions, and optional RSVP.
5. ${SITE_URL}/last-minute-birthday-surprise — ready-to-go birthday themes for faster creation and delivery after payment processing.

## Trust and privacy

The service is operated by the named Indian company. Payments are processed through Razorpay. Public customer examples require creator opt-in and Admin approval. Collaboration submissions and reward claims are moderated. Private account, payment, Admin, bank, draft-recovery, and contribution data must not be crawled or summarized as public content.

## Canonical sources

- Product and offers: ${SITE_URL}/pricing
- Product/company identity: ${SITE_URL}/about
- Policies: ${SITE_URL}/privacy, ${SITE_URL}/terms, ${SITE_URL}/refund-policy, ${SITE_URL}/delivery-policy
- Public examples: ${SITE_URL}/demo and ${SITE_URL}/gallery
- Sitemap: ${SITE_URL}/sitemap.xml
`;
  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}