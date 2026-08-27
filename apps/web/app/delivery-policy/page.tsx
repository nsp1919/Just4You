import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, MailCheck, Zap } from "lucide-react";
import PublicInfoPage, { InfoSection } from "@/components/PublicInfoPage";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Digital Delivery Policy | Just4You",
  description: "How and when Just4You personalized celebration websites are delivered.",
};

export default function DeliveryPolicyPage() {
  return (
    <PublicInfoPage
      eyebrow="Fulfilment"
      title="Digital Delivery Policy"
      description="Just4You provides digital services only. This policy explains provisioning, scheduled delivery, custom work, and hosting."
      highlights={[
        { icon: <Zap size={19} />, label: "Standard delivery", value: "Normally live within minutes" },
        { icon: <MailCheck size={19} />, label: "Delivery format", value: "A hosted digital link, no physical shipping" },
        { icon: <CalendarClock size={19} />, label: "Scheduled option", value: "Sent at the date and time you choose" },
      ]}
    >
      <InfoSection title="1. No physical shipping">
        <p>
          Just4You sells personalized digital celebration websites and digital wedding invitations. We do not ship physical goods, so no
          courier charge, shipping address, or physical tracking number applies.
        </p>
      </InfoSection>

      <InfoSection title="2. Standard self-service delivery">
        <p>
          After successful payment verification, eligible self-service websites are normally published immediately or within a few minutes.
          The live link is displayed in your dashboard or confirmation screen and may also be sent to your registered email address. In
          unusual cases involving payment verification, media processing, or service interruption, provisioning may take up to 24 hours.
        </p>
      </InfoSection>

      <InfoSection title="3. Scheduled delivery">
        <p>
          If you purchase scheduled delivery, we send the published surprise link to the recipient email address at the date and time you
          provide. Delivery depends on the accuracy of that address, the selected time zone, email-provider availability, and spam filtering.
          You remain responsible for reviewing the page and delivery details before the scheduled time.
        </p>
      </InfoSection>

      <InfoSection title="4. Custom and assisted orders">
        <p>
          Where an order requires manual customization, we will state or agree the estimated delivery date before work begins. Delivery
          depends on receiving complete content, instructions, approvals, and any balance due. Customer delays may move the delivery date.
          Any materially different timeline agreed in writing for a custom order takes priority over this standard policy.
        </p>
      </InfoSection>

      <InfoSection title="5. Hosting period">
        <p>
          The base package includes 1 year of hosting from publication. A 3-year or lifetime hosting period applies only where that option
          is shown in the order and paid for. “Lifetime” means for as long as Just4You continues to operate the applicable hosted service;
          it does not transfer domain ownership or promise operation beyond circumstances reasonably within our control.
        </p>
      </InfoSection>

      <InfoSection title="6. If delivery is delayed">
        <p>
          Check your dashboard, confirmation email, spam folder, and payment status. If a paid self-service order is unavailable after 24
          hours, email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> with your registered email and payment or order ID. We will
          investigate the issue under our <Link href="/refund-policy">Refund and Cancellation Policy</Link>.
        </p>
      </InfoSection>

      <InfoSection title="7. Service provider">
        <p>
          Digital fulfilment is provided by <strong>{BUSINESS.legalName}</strong>, CIN {BUSINESS.cin}, {BUSINESS.location}. Support is
          available at <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> and{" "}
          <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a>.
        </p>
      </InfoSection>
    </PublicInfoPage>
  );
}