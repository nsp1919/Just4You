import type { Metadata } from "next";
import Link from "next/link";
import PublicInfoPage, { InfoSection } from "@/components/PublicInfoPage";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "About Just4You | A Novantix Technologies Product",
  description: "Just4You is a personalized digital celebration product owned and operated by Novantix Technologies.",
};

export default function AboutPage() {
  return (
    <PublicInfoPage
      eyebrow="Product & company"
      title="About Just4You"
      description="A Novantix Technologies product that turns photos, music, messages, and meaningful dates into personal digital celebrations."
    >
      <InfoSection title="What Just4You provides">
        <p>
          Just4You is a digital platform for creating personalized birthday, anniversary, proposal, graduation, kids birthday, and other
          celebration websites, along with digital wedding invitations. Customers can choose a theme, add their own content, select optional
          features, pay online in {BUSINESS.currency}, and receive a hosted link to share.
        </p>
        <p>
          Available options include photo galleries, music, voice and video messages, countdown reveals, guest wishes, scheduled email
          delivery, analytics, custom links, and extended hosting. Current package contents and charges appear on the{" "}
          <Link href="/pricing">Pricing page</Link>.
        </p>
      </InfoSection>

      <InfoSection title="Who owns and operates Just4You">
        <p>
          Just4You is a product owned and operated by <strong>{BUSINESS.legalName}</strong>, a Government of India registered company with
          CIN {BUSINESS.cin}. Just4You is not a separate company or legal entity.
        </p>
        <p>
          Novantix Technologies is responsible for the Just4You service, customer support, payment processing arrangements, invoices,
          digital delivery, refunds, and applicable regulatory obligations. You can verify the company at{" "}
          <a href={BUSINESS.companyUrl} target="_blank" rel="noreferrer">novantixtech.com</a>.
        </p>
      </InfoSection>

      <InfoSection title="How the service works">
        <ul>
          <li>Choose an occasion, theme, and feature package.</li>
          <li>Add the recipient details and content you have permission to share.</li>
          <li>Review the price in INR and complete secure online payment.</li>
          <li>Receive a hosted digital link immediately for eligible orders or on the agreed delivery schedule.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Business details">
        <p>
          <strong>{BUSINESS.legalName}</strong><br />
          CIN: {BUSINESS.cin}<br />
          {BUSINESS.location}<br />
          Email: <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a><br />
          Phone: <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a>
        </p>
      </InfoSection>
    </PublicInfoPage>
  );
}