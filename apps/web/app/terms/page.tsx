import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Globe2, IndianRupee } from "lucide-react";
import PublicInfoPage, { InfoSection } from "@/components/PublicInfoPage";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Terms and Conditions | Just4You",
  description: "Terms governing purchases and use of the Just4You digital celebration website service.",
};

export default function TermsPage() {
  return (
    <PublicInfoPage
      eyebrow="Legal"
      title="Terms and Conditions"
      description={`These terms govern your use of Just4You, a digital product owned and operated by ${BUSINESS.legalName}.`}
      highlights={[
        { icon: <Building2 size={19} />, label: "Merchant of record", value: "Novantix Technologies" },
        { icon: <IndianRupee size={19} />, label: "Transaction currency", value: "Indian Rupees (INR)" },
        { icon: <Globe2 size={19} />, label: "Service type", value: "Personalized digital websites" },
      ]}
    >
      <InfoSection title="1. Agreement and operator">
        <p>
          By accessing {BUSINESS.productUrl}, creating an account, or purchasing a service, you agree to these terms. The contracting
          business and merchant of record is <strong>{BUSINESS.legalName}</strong>, CIN {BUSINESS.cin}, located in {BUSINESS.location}.
          Just4You is a product name and is not presented as a separate legal entity.
        </p>
      </InfoSection>

      <InfoSection title="2. Service description">
        <p>
          Just4You provides personalized digital celebration websites and wedding invitations. Depending on the package selected,
          a website may include themes, photos, messages, music, voice or video content, countdowns, guest reactions, analytics,
          scheduled delivery, a custom link, and a stated hosting period.
        </p>
        <p>
          The features, price, delivery method, and hosting term shown at checkout form part of your order. See the{" "}
          <Link href="/pricing">Pricing page</Link> and <Link href="/delivery-policy">Digital Delivery Policy</Link> for details.
        </p>
      </InfoSection>

      <InfoSection title="3. Accounts and customer responsibilities">
        <ul>
          <li>You must provide accurate account, recipient, order, and billing information.</li>
          <li>You are responsible for safeguarding your sign-in credentials and for activity under your account.</li>
          <li>You must have the right and permission to upload and publish all photos, audio, video, messages, names, and other content.</li>
          <li>You must not upload unlawful, abusive, infringing, deceptive, or malicious content.</li>
        </ul>
        <p>We may remove prohibited content or suspend access where reasonably necessary to protect users, third parties, or the service.</p>
      </InfoSection>

      <InfoSection title="4. Prices, payments, and invoices">
        <p>
          Prices are displayed and charged in <strong>{BUSINESS.currency}</strong>. Your final payable total is shown before you confirm
          payment. Online payments are securely processed by Razorpay or another payment provider shown at checkout; we do not receive
          or store your complete card, UPI PIN, or banking credentials.
        </p>
        <p>
          Payments are collected for {BUSINESS.legalName}, and invoices are issued by {BUSINESS.legalName} using the customer and order
          details supplied at checkout. You are responsible for checking those details before payment.
        </p>
      </InfoSection>

      <InfoSection title="5. Cancellation and refunds">
        <p>
          Digital work can begin immediately after successful payment. Cancellations and refunds are therefore limited and are governed
          by our <Link href="/refund-policy">Refund and Cancellation Policy</Link>, which is incorporated into these terms.
        </p>
      </InfoSection>

      <InfoSection title="6. Delivery and hosting">
        <p>
          Self-service websites are normally made available digitally after successful payment and processing. Scheduled or custom work
          follows the delivery timing shown in the order or separately agreed in writing. No physical goods are shipped. Hosting lasts
          for the period included in the purchased package, subject to these terms and any lawful service suspension.
        </p>
      </InfoSection>

      <InfoSection title="7. Intellectual property and customer content">
        <p>
          Just4You software, designs, trademarks, and platform content remain owned by or licensed to {BUSINESS.legalName}. You retain
          ownership of content you upload. You grant us a limited licence to host, process, display, and transmit that content only as
          needed to provide, secure, support, and improve your purchased service.
        </p>
      </InfoSection>

      <InfoSection title="8. Availability and liability">
        <p>
          We work to keep the service available and your content accessible for the purchased term, but internet and third-party services
          can experience interruptions. To the extent permitted by Indian law, our aggregate liability arising from an order will not
          exceed the amount paid for that order. Nothing in these terms excludes rights or remedies that cannot lawfully be excluded.
        </p>
      </InfoSection>

      <InfoSection title="9. Reaction recordings and social rewards">
        <p>
          A person who records a reaction must explicitly consent before the video is sent to the celebration creator. Creators may share
          only recordings carrying that consent and remain responsible for complying with the rules of Instagram, WhatsApp, and applicable law.
        </p>
        <p>
          A social-post reward is limited to one promotional credit per celebration, subject to administrator verification of a genuine
          public Instagram post or WhatsApp Status screenshot. Duplicate, misleading, inaccessible, deleted, or otherwise unverifiable proof
          may be rejected. An approved social-post reward becomes wallet earnings and may be withdrawn after the account reaches the current
          minimum withdrawal amount. Unverified claims and promotional signup credit are not withdrawable.
        </p>
      </InfoSection>

      <InfoSection title="10. Governing law and contact">
        <p>
          These terms are governed by the laws of India. Courts with jurisdiction in Hyderabad, Telangana will have jurisdiction, subject
          to applicable consumer-protection law. Questions or complaints may be sent to{" "}
          <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a>.
        </p>
      </InfoSection>
    </PublicInfoPage>
  );
}