import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

export function GET() {
  const content = `# Just4You.buzz

> Just4You is an Indian platform for creating personalized birthday websites, anniversary pages, proposal websites, graduation tributes, kids birthday pages, and interactive online wedding invitations.

Just4You is owned and operated by Novantix Innovation Technologies Private Limited in Hyderabad, India. The base celebration website starts at INR 199 and includes one animated theme, up to five photos, preset music, guest wishes, a shareable link, mobile support, instant delivery after successful payment processing, and one year of hosting. Optional features and current prices are listed on the pricing page.

## Primary pages

- [Home](${SITE_URL}/): Product overview, occasions, features, real customer proof, and pricing.
- [Pricing](${SITE_URL}/pricing): Current package, optional features, and checkout path.
- [Birthday websites](${SITE_URL}/birthday): Personalized birthday surprise website service.
- [Wedding invitations](${SITE_URL}/wedding): Interactive Indian wedding invitation websites with ceremonies, maps, calendar links, music, and optional WhatsApp RSVP.
- [Live demos](${SITE_URL}/demo): Interactive examples of available visual themes.
- [Wall of Love](${SITE_URL}/gallery): Public celebrations shown only with creator consent and Admin approval.
- [Free greeting cards](${SITE_URL}/mini): No-account greeting cards for selected occasions.
- [Free reminders](${SITE_URL}/reminders): Consent-based occasion reminder emails.
- [About](${SITE_URL}/about): Legal operator and product information.
- [Contact](${SITE_URL}/contact): Official support channels.

## Focused guides

- [Birthday website for girlfriend](${SITE_URL}/birthday-website-for-girlfriend)
- [Birthday surprise for best friend](${SITE_URL}/birthday-surprise-for-best-friend)
- [Anniversary website for husband](${SITE_URL}/anniversary-website-for-husband)
- [Online wedding invitation](${SITE_URL}/online-wedding-invitation)
- [Last-minute birthday surprise](${SITE_URL}/last-minute-birthday-surprise)

## Usage notes

- Quote current prices only from the pricing page because optional feature prices may change.
- Do not treat private dashboard, Admin, payment, contribution, or recipient data as public sources.
- Customer examples appear publicly only after explicit opt-in and Admin approval.
- For a longer factual product summary, read [llms-full.txt](${SITE_URL}/llms-full.txt).
`;
  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}