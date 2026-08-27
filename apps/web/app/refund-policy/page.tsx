import type { Metadata } from "next";
import { CalendarDays, Clock3, RotateCcw } from "lucide-react";
import PublicInfoPage, { InfoSection } from "@/components/PublicInfoPage";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Refund and Cancellation Policy | Just4You",
  description: "Cancellation eligibility, refund conditions, and processing timelines for Just4You digital services.",
};

export default function RefundPolicyPage() {
  return (
    <PublicInfoPage
      eyebrow="Payments"
      title="Refund and Cancellation Policy"
      description="Just4You supplies personalized digital services that can begin immediately after payment. This policy states when an order may be cancelled or refunded."
      highlights={[
        { icon: <CalendarDays size={19} />, label: "Request window", value: "Within 7 calendar days" },
        { icon: <Clock3 size={19} />, label: "Review outcome", value: "Normally within 5 business days" },
        { icon: <RotateCcw size={19} />, label: "Approved refunds", value: "Returned to the original payment method" },
      ]}
    >
      <InfoSection title="1. Before payment">
        <p>
          You can change your package or stop checkout at any time before payment is completed. No cancellation request is needed where
          payment was not successfully captured.
        </p>
      </InfoSection>

      <InfoSection title="2. After successful payment">
        <p>
          Because personalized digital work and automated provisioning may begin immediately after successful payment, confirmed orders
          are generally final. An order cannot ordinarily be cancelled once the celebration website has been generated, published,
          delivered, downloaded, or custom work has started.
        </p>
      </InfoSection>

      <InfoSection title="3. When a refund may be approved">
        <p>We will review a refund request where:</p>
        <ul>
          <li>you were charged more than once for the same order;</li>
          <li>payment was captured but the purchased digital service was not provisioned due to a fault on our side;</li>
          <li>the service delivered materially differs from the package purchased and we cannot correct it within a reasonable time; or</li>
          <li>a refund is required under applicable Indian law.</li>
        </ul>
        <p>
          Refunds are not provided for change of mind, accidental purchase after delivery, dissatisfaction based only on personal taste,
          customer-supplied errors, failure to use the service, or issues caused by unsupported devices or third-party connectivity.
        </p>
      </InfoSection>

      <InfoSection title="4. How and when to request a refund">
        <p>
          Email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> within <strong>7 calendar days</strong> of the payment or delivery,
          whichever is later. Include your registered email, order or payment ID, amount paid, reason, and supporting screenshots. We will
          normally acknowledge the request within 2 business days and communicate the outcome within 5 business days after receiving all
          information needed to review it.
        </p>
      </InfoSection>

      <InfoSection title="5. Approved refund timeline">
        <p>
          Approved refunds are initiated to the original payment method within <strong>5 business days</strong>. Banks and payment providers
          may take a further <strong>5 to 10 business days</strong> to display the credit. We cannot direct a refund to a different card,
          UPI ID, bank account, or wallet. Payment-provider or bank delays are outside our direct control.
        </p>
      </InfoSection>

      <InfoSection title="6. Failed or pending payments">
        <p>
          If your account was debited but our checkout shows a failed or pending payment, first allow 5 to 7 business days for an automatic
          bank reversal. If the amount is not reversed, contact us with the payment reference. Do not share a CVV, OTP, UPI PIN, or password.
        </p>
      </InfoSection>

      <InfoSection title="7. Operator and contact">
        <p>
          Refunds and cancellations are handled by <strong>{BUSINESS.legalName}</strong>, CIN {BUSINESS.cin}, {BUSINESS.location}. Contact{" "}
          <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a>.
        </p>
      </InfoSection>
    </PublicInfoPage>
  );
}