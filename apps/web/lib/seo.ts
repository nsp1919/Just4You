import { BUSINESS } from "@/lib/business";
import type { Metadata } from "next";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || BUSINESS.productUrl;
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export function publicPageMetadata(input: {
  path: string;
  title: string;
  description: string;
  keywords?: string[];
}): Metadata {
  const url = `${SITE_URL}${input.path}`;
  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: { canonical: input.path || "/" },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: "Just4You.buzz",
      locale: "en_IN",
      type: "website",
      images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: "Just4You birthday websites and online invitations" }],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [`${SITE_URL}/opengraph-image`],
    },
  };
}

export function siteEntityGraph() {
  const instagramUrl = BUSINESS.instagramUrl.replace(/\/$/, "");
  const sameAs: string[] = [BUSINESS.companyUrl];
  if (instagramUrl !== "https://www.instagram.com") sameAs.push(BUSINESS.instagramUrl);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: BUSINESS.legalName,
        alternateName: [BUSINESS.publicName, BUSINESS.productName],
        url: SITE_URL,
        email: BUSINESS.email,
        telephone: BUSINESS.phoneDisplay,
        identifier: {
          "@type": "PropertyValue",
          propertyID: "CIN",
          value: BUSINESS.cin,
        },
        address: {
          "@type": "PostalAddress",
          addressLocality: "Hyderabad",
          addressRegion: "Telangana",
          addressCountry: "IN",
        },
        sameAs,
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: "Just4You.buzz",
        alternateName: "Just4You",
        url: SITE_URL,
        inLanguage: "en-IN",
        publisher: { "@id": ORGANIZATION_ID },
      },
      {
        "@type": "Service",
        "@id": `${SITE_URL}/#celebration-website-service`,
        name: "Personalized celebration website creation",
        serviceType: "Birthday websites and online wedding invitations",
        description: "Personalized digital celebration websites for birthdays, anniversaries, proposals, graduations and weddings, with photos, music, messages and interactive reveals.",
        provider: { "@id": ORGANIZATION_ID },
        areaServed: { "@type": "Country", name: "India" },
        availableChannel: {
          "@type": "ServiceChannel",
          serviceUrl: `${SITE_URL}/pricing`,
          availableLanguage: ["English"],
        },
        offers: {
          "@type": "Offer",
          price: "199",
          priceCurrency: "INR",
          url: `${SITE_URL}/pricing`,
          availability: "https://schema.org/InStock",
        },
      },
    ],
  };
}

export function intentPageGraph(input: {
  path: string;
  title: string;
  description: string;
  serviceType: string;
  audience: string;
  faqs: Array<{ question: string; answer: string }>;
}) {
  const url = `${SITE_URL}${input.path}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}/#webpage`,
        url,
        name: input.title,
        description: input.description,
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": `${url}/#service` },
        inLanguage: "en-IN",
      },
      {
        "@type": "Service",
        "@id": `${url}/#service`,
        name: input.title,
        serviceType: input.serviceType,
        description: input.description,
        provider: { "@id": ORGANIZATION_ID },
        areaServed: { "@type": "Country", name: "India" },
        audience: { "@type": "Audience", audienceType: input.audience },
        offers: {
          "@type": "Offer",
          price: "199",
          priceCurrency: "INR",
          url: `${SITE_URL}/pricing`,
          availability: "https://schema.org/InStock",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}/#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: input.title, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${url}/#faq`,
        mainEntity: input.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };
}