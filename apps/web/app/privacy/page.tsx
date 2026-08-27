import type { Metadata } from "next";
import { CreditCard, EyeOff, ShieldCheck } from "lucide-react";
import PublicInfoPage, { InfoSection } from "@/components/PublicInfoPage";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Privacy Policy | Just4You",
  description: "How Novantix Technologies collects, uses, stores, and shares information for the Just4You service.",
};

export default function PrivacyPage() {
  return (
    <PublicInfoPage
      eyebrow="Privacy"
      title="Privacy Policy"
      description={`This policy explains how ${BUSINESS.legalName} handles personal information when you use Just4You.`}
      highlights={[
        { icon: <ShieldCheck size={19} />, label: "Data controller", value: "Novantix Technologies" },
        { icon: <CreditCard size={19} />, label: "Payment security", value: "Credentials stay with the payment provider" },
        { icon: <EyeOff size={19} />, label: "Our commitment", value: "We do not sell personal information" },
      ]}
    >
      <InfoSection title="1. Who controls your information">
        <p>
          <strong>{BUSINESS.legalName}</strong>, CIN {BUSINESS.cin}, is the operator of Just4You and the controller of personal information
          described in this policy. Just4You is a product name, not a separate legal entity.
        </p>
      </InfoSection>

      <InfoSection title="2. Information we collect">
        <ul>
          <li>Account and contact details, such as your name, email address, and authentication information.</li>
          <li>Order and billing details, including the selected package, amount, payment status, transaction identifiers, and invoice details.</li>
          <li>Content you provide, including recipient names, dates, messages, photos, audio, video, links, and delivery instructions.</li>
          <li>Support communications, feedback, refund requests, and other information you send to us.</li>
          <li>Technical and usage data, such as IP address, browser, device, page activity, referral source, and basic analytics.</li>
        </ul>
        <p>
          Payment providers process your card, UPI, wallet, or banking credentials. We do not receive or store complete payment credentials
          such as your full card number, CVV, UPI PIN, or banking password.
        </p>
      </InfoSection>

      <InfoSection title="3. How we use information">
        <ul>
          <li>To create, host, deliver, and support your personalized digital website.</li>
          <li>To authenticate users, administer accounts, process orders, confirm payments, issue invoices, and handle refunds.</li>
          <li>To send transactional messages, scheduled deliveries, service notices, and responses to support requests.</li>
          <li>To secure the service, prevent fraud and misuse, diagnose faults, and enforce our terms.</li>
          <li>To understand service performance and improve features, usability, and customer support.</li>
          <li>To meet accounting, tax, legal, regulatory, and dispute-resolution obligations.</li>
        </ul>
      </InfoSection>

      <InfoSection title="4. When information is shared">
        <p>We share information only where reasonably necessary to operate the service or comply with law, including with:</p>
        <ul>
          <li>Payment providers such as Razorpay for payment processing, verification, fraud prevention, and refunds.</li>
          <li>Cloud hosting, database, media storage, email, analytics, and security providers used to deliver Just4You.</li>
          <li>Professional advisers, regulators, courts, law enforcement, or other authorities where legally required.</li>
          <li>A successor organization in connection with a lawful merger, acquisition, restructuring, or transfer of the business.</li>
        </ul>
        <p>We do not sell your personal information.</p>
      </InfoSection>

      <InfoSection title="5. Visibility of celebration content">
        <p>
          Celebration pages are designed to be shared by link. Anyone who receives an unprotected link may be able to view its content.
          If you enable passcode protection, recipients must enter that passcode, but you should still upload only content you are permitted
          to share. Guest messages and reactions may be visible on the applicable celebration page.
        </p>
      </InfoSection>

      <InfoSection title="6. Retention and security">
        <p>
          Celebration content is normally retained for the hosting term you purchase, unless you request earlier deletion or retention is
          required for legal or dispute purposes. Account, transaction, invoice, and support records may be retained for the period required
          by applicable law and legitimate business needs. We use reasonable technical and organizational safeguards, but no online system
          can guarantee absolute security.
        </p>
      </InfoSection>

      <InfoSection title="7. Your choices and rights">
        <p>
          You may ask to access, correct, or delete personal information we control, or withdraw consent where processing relies on consent.
          Some records may need to be retained for legal, tax, fraud-prevention, or dispute purposes. To make a request, email{" "}
          <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> from the address linked to your account.
        </p>
      </InfoSection>

      <InfoSection title="8. Contact">
        <p>
          Privacy questions or complaints can be sent to <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>, phoned to{" "}
          <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a>, or addressed to {BUSINESS.legalName}, {BUSINESS.location}.
        </p>
      </InfoSection>
    </PublicInfoPage>
  );
}