import type { Metadata } from "next";
import Link from "next/link";
import PublicInfoPage, { InfoSection } from "@/components/PublicInfoPage";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Contact Us | Just4You",
  description: "Contact Novantix Technologies for Just4You customer, payment, delivery, privacy, and refund support.",
};

export default function ContactPage() {
  return (
    <PublicInfoPage
      eyebrow="Customer support"
      title="Contact the Just4You team"
      description={`All Just4You customer support is provided by ${BUSINESS.legalName}.`}
    >
      <InfoSection title="Support channels">
        <p>
          Email: <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a><br />
          Phone and WhatsApp: <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a><br />
          WhatsApp chat: <a href={BUSINESS.whatsappUrl} target="_blank" rel="noreferrer">Start a conversation</a><br />
          Business location: {BUSINESS.location}
        </p>
      </InfoSection>

      <InfoSection title="Payment, refund, or delivery support">
        <p>
          To help us find your order, contact us from your registered email and include your order ID or Razorpay payment ID, payment date,
          amount in INR, and a short description of the issue. Include screenshots where useful. Never send us your card CVV, OTP, UPI PIN,
          bank password, or complete card number.
        </p>
        <p>
          We normally acknowledge support and refund messages within 2 business days. Refund review and payment timelines are stated in our{" "}
          <Link href="/refund-policy">Refund and Cancellation Policy</Link>.
        </p>
      </InfoSection>

      <InfoSection title="Business and merchant identity">
        <p>
          Just4You is a product of <strong>{BUSINESS.legalName}</strong>, CIN {BUSINESS.cin}. Payments are processed and invoices are issued
          by Novantix Technologies. The company’s primary website is{" "}
          <a href={BUSINESS.companyUrl} target="_blank" rel="noreferrer">novantixtech.com</a>.
        </p>
      </InfoSection>
    </PublicInfoPage>
  );
}